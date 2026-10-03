#!/usr/bin/env bash
# Claude Code WorktreeCreate / WorktreeRemove hook.
#
#   worktree.sh create   reads {"name": ...} on stdin, prints the worktree path on stdout
#   worktree.sh remove   reads {"worktree_path": ...} on stdin
#
# A configured WorktreeCreate hook replaces Claude Code's own `git worktree add`, so
# .worktreeinclude is not applied: this script copies the gitignored env files itself.
#
# Each worktree gets a numbered slot. Slot N moves every local port by N * PORT_STEP
# (API 4004 -> 4014, Vite 5173 -> 5183 for slot 1), so dev servers in different
# worktrees do not collide. The ports are written to .claude/worktree.env.
set -euo pipefail

API_BASE_PORT=4004
VITE_BASE_PORT=5173
PORT_STEP=10
MAX_SLOT=99
PROJECTS=(api client cli)

# Claude Code reads stdout as the worktree path, so send everything else to stderr.
exec 3>&1 1>&2

log() { printf '[worktree-hook] %s\n' "$*"; }
die() {
    log "error: $*"
    exit 1
}

command -v jq >/dev/null || die 'jq is required'
input=$(cat)
field() { jq -r --arg k "$1" '.[$k] // empty' <<<"$input"; }

# Resolves the main checkout from any directory inside the repository.
resolve_repo() {
    common_dir=$(git -C "$1" rev-parse --path-format=absolute --git-common-dir) ||
        die "not a git repository: $1"
    main_root=$(dirname "$common_dir")
    registry="$common_dir/claude-worktree-slots"
    touch "$registry"
}

port_busy() { [ -n "$(ss -Hltn "sport = :$1" 2>/dev/null)" ]; }
api_port() { echo $((API_BASE_PORT + $1 * PORT_STEP)); }
vite_port() { echo $((VITE_BASE_PORT + $1 * PORT_STEP)); }

# Registry lines are "<slot>\t<worktree path>". Callers must hold the lock.
prune_registry() {
    local tmp slot path
    tmp=$(mktemp)
    while IFS=$'\t' read -r slot path; do
        [ -d "$path" ] && printf '%s\t%s\n' "$slot" "$path"
    done <"$registry" >"$tmp"
    mv "$tmp" "$registry"
}

allocate_slot() {
    local path=$1 slot
    (
        flock 9
        prune_registry
        slot=$(awk -F'\t' -v p="$path" '$2 == p { print $1 }' "$registry")
        if [ -n "$slot" ]; then
            echo "$slot"
            exit 0
        fi
        for ((slot = 1; slot <= MAX_SLOT; slot++)); do
            cut -f1 "$registry" | grep -qx "$slot" && continue
            port_busy "$(api_port "$slot")" && continue
            port_busy "$(vite_port "$slot")" && continue
            printf '%s\t%s\n' "$slot" "$path" >>"$registry"
            echo "$slot"
            exit 0
        done
        exit 1
    ) 9>"$registry.lock"
}

release_slot() {
    local path=$1
    (
        flock 9
        awk -F'\t' -v p="$path" '$2 != p' "$registry" >"$registry.tmp"
        mv "$registry.tmp" "$registry"
    ) 9>"$registry.lock"
}

# Copies gitignored .env* files from the main checkout and moves their ports.
copy_env_files() {
    local wt=$1 api=$2 vite=$3 proj src dst
    for proj in "${PROJECTS[@]}"; do
        for src in "$main_root/$proj"/.env*; do
            [ -f "$src" ] || continue
            git -C "$main_root" check-ignore -q "$src" || continue
            dst="$wt/$proj/$(basename "$src")"
            [ -e "$dst" ] && continue
            cp -p "$src" "$dst"
            sed -i -E \
                -e "s/^([[:space:]]*PORT[[:space:]]*=[[:space:]]*)${API_BASE_PORT}\b/\1${api}/" \
                -e "s/:${API_BASE_PORT}\b/:${api}/g" \
                -e "s/:${VITE_BASE_PORT}\b/:${vite}/g" \
                "$dst"
            log "copied $proj/$(basename "$src")"
        done
    done

    # vite.config.ts reads VITE_PORT for the dev server.
    local client_env="$wt/client/.env.development.local"
    if ! grep -qs '^[[:space:]]*VITE_PORT' "$client_env"; then
        # Start a new line if the copied file has no trailing newline.
        [ -s "$client_env" ] && [ -n "$(tail -c1 "$client_env")" ] && echo >>"$client_env"
        printf 'VITE_PORT = %s\n' "$vite" >>"$client_env"
    fi
}

# Copies files that are not env files but are slow or impossible to rebuild offline.
copy_local_state() {
    local wt=$1 rel
    for rel in .claude/settings.local.json client/src/__generated__ cli/src/graphql/__generated__; do
        if [ -e "$main_root/$rel" ] && [ ! -e "$wt/$rel" ]; then
            mkdir -p "$(dirname "$wt/$rel")"
            cp -a "$main_root/$rel" "$wt/$rel"
            log "copied $rel"
        fi
    done
}

load_node() {
    command -v npm >/dev/null && return 0
    export NVM_DIR=${NVM_DIR:-$HOME/.nvm}
    [ -s "$NVM_DIR/nvm.sh" ] || return 1
    set +u
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
    if ! { [ -f "$1/.nvmrc" ] && nvm use --silent "$(cat "$1/.nvmrc")" >/dev/null 2>&1; }; then
        log 'node version from .nvmrc is not installed, using the nvm default'
        nvm use --silent default >/dev/null
    fi
    set -u
    command -v npm >/dev/null
}

install_deps() {
    local wt=$1 log_file=$2 proj failed=0
    local -A pids=()
    if [ "${RECIPE_WORKTREE_SKIP_INSTALL:-}" = 1 ]; then
        log 'skipped npm ci (RECIPE_WORKTREE_SKIP_INSTALL=1)'
        return 0
    fi
    if ! load_node "$wt"; then
        log 'npm not found, skipped dependency install'
        return 0
    fi
    for proj in "${PROJECTS[@]}"; do
        [ -f "$wt/$proj/package-lock.json" ] || continue
        [ -d "$wt/$proj/node_modules" ] && continue
        (cd "$wt/$proj" && npm ci --prefer-offline --no-audit --no-fund) >>"$log_file.$proj" 2>&1 &
        pids[$proj]=$!
    done
    for proj in "${!pids[@]}"; do
        if wait "${pids[$proj]}"; then
            log "installed $proj dependencies"
        else
            log "npm ci failed in $proj, see $log_file.$proj"
            failed=1
        fi
    done
    return $failed
}

create() {
    local name wt branch base slot api vite log_file
    name=$(field name)
    [ -n "$name" ] || die 'hook input has no "name"'
    local cwd
    cwd=$(field cwd)
    resolve_repo "${cwd:-$PWD}"

    wt="$main_root/.claude/worktrees/${name//\//+}"
    branch="worktree-$name"

    if git -C "$main_root" worktree list --porcelain | grep -qxF "worktree $wt"; then
        log "reusing existing worktree $wt"
    else
        git -C "$main_root" fetch --quiet origin 2>/dev/null || log 'git fetch failed, using local refs'
        base=$(git -C "$main_root" symbolic-ref -q --short refs/remotes/origin/HEAD || echo HEAD)
        if git -C "$main_root" show-ref --verify --quiet "refs/heads/$branch"; then
            git -C "$main_root" worktree add "$wt" "$branch"
        else
            # --no-track: a plain `git push` must not target the base branch.
            git -C "$main_root" worktree add --no-track -b "$branch" "$wt" "$base"
        fi
    fi

    slot=$(allocate_slot "$wt") || die "no free port slot (1-$MAX_SLOT)"
    api=$(api_port "$slot")
    vite=$(vite_port "$slot")

    copy_env_files "$wt" "$api" "$vite"
    copy_local_state "$wt"
    mkdir -p "$wt/.claude"
    cat >"$wt/.claude/worktree.env" <<EOF
# Generated by .claude/hooks/worktree.sh. Local ports for this worktree.
WORKTREE_SLOT=$slot
API_PORT=$api
VITE_PORT=$vite
API_URL=http://localhost:$api/
CLIENT_URL=http://localhost:$vite/
EOF
    log "slot $slot: API on $api, Vite on $vite"

    log_file="$common_dir/claude-worktree-logs/${name//\//+}.npm.log"
    mkdir -p "$(dirname "$log_file")"
    install_deps "$wt" "$log_file" || log 'dependency install incomplete, run npm ci manually'

    echo "$wt" >&3
}

remove() {
    local wt branch=''
    wt=$(field worktree_path)
    [ -n "$wt" ] || die 'hook input has no "worktree_path"'

    if [ -d "$wt" ]; then
        resolve_repo "$wt"
        branch=$(git -C "$wt" branch --show-current 2>/dev/null || true)
    else
        local cwd
        cwd=$(field cwd)
        resolve_repo "${cwd:-$PWD}"
    fi

    if [ -d "$wt" ]; then
        git -C "$main_root" worktree remove --force "$wt" || rm -rf "$wt"
    fi
    git -C "$main_root" worktree prune
    release_slot "$wt"
    log "removed $wt"

    # -d refuses to delete a branch with unmerged commits, so work is never lost.
    if [ -n "$branch" ]; then
        git -C "$main_root" branch -d "$branch" >/dev/null 2>&1 ||
            log "kept branch $branch (not merged)"
    fi
}

case "${1:-}" in
create) create ;;
remove) remove ;;
*) die "usage: $0 create|remove" ;;
esac
