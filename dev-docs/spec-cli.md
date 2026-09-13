# Spec: `recipe` CLI

**Status:** ready to implement once `spec-usda-portions.md` is merged
**Depends on:** `spec-usda-portions.md` (portion data), the `73-calorie-counting` branch
**Location:** `cli/` at the repository root

## Overview

A command line tool for querying and modifying the recipe database. The primary consumer is
an AI agent; a human operator is the secondary consumer. The first use case is linking USDA
food items to existing ingredients in bulk, so that a workflow like this becomes possible:

> "Go through the ingredients in this recipe. For each one without nutritional data, search
> USDA, pick the best match, and link it."

The CLI is the third npm project in the repository, alongside `api/` and `client/`. There is
no monorepo tooling, and this change does not add any.

## Goals

- Let an agent enumerate recipes and ingredients, and see which lack nutritional data.
- Let an agent search USDA and inspect a candidate's macros and portions before choosing.
- Let an agent link a chosen USDA item to an ingredient, including portion-derived `perUnit`.
- Make every write reviewable before it happens.

## Non-goals

- Replacing the web UI. The CLI covers the linking workflow, not recipe authoring.
- A general CRUD surface over the whole schema. Read commands exist to support linking.
- Direct database access. See decision 1.

## Design decisions

### 1. GraphQL only, no direct MongoDB access

The CLI talks to the running API over HTTP, using the same resolvers as the web client.

This keeps one source of truth for validation, ownership and authorization. Writing to
MongoDB directly would bypass `isDocumentOwnerOrAdmin`, the `uniqueInAdminsAndUser`
validators, and the `Recipe` post-save hooks — and would force a second copy of the USDA API
key into the CLI environment. The key currently stays server-side, which
`spec-document.md` records as a deliberate decision.

The cost is that the API must be running, and bulk work is N round trips. Both are
acceptable for a tool that will process tens of ingredients at a time, not thousands.

### 2. Configuration in env files, authentication transparent

Configuration mirrors `api/` and `client/`: `.env.<mode>.local` files read through
`dotenv-flow`, with a `src/constants.ts` exporting typed values. `NODE_ENV` selects the mode
and defaults to `development`. Every `.env.*.local` name is already covered by the root
`.gitignore`, and credentials sit beside the ones `api/.env.development.local` already holds.

```text
cli/.env.development.local
  RECIPE_API_URL = http://localhost:4000/
  RECIPE_USERNAME = matt
  RECIPE_PASSWORD = ...
```

Auth is session-based: `passport` + `express-session` with a MongoDB session store
([`api/src/index.ts:39-46`](api/src/index.ts#L39-L46)). A cookie is runtime state the tool
writes, so it does not belong in an env file. Instead:

1. Every command runs through one transport wrapper.
2. The wrapper sends the cached `connect.sid` cookie if it has one.
3. On a response of `UNAUTHENTICATED`, or with no cached cookie, it calls the `login`
   mutation with `RECIPE_USERNAME` and `RECIPE_PASSWORD`, reads the cookie from the
   `Set-Cookie` header (`response.headers.getSetCookie()`, Node 20+; CI uses Node 24),
   caches it, and retries the original operation **once**.
4. A second failure is a real authentication error: exit 3.

**This removes `auth login` as a required step.** An agent runs
`recipe ingredients list` as its first command and it works. There is no separate
authentication step to forget, and no expired-session failure part-way through a bulk run —
the retry re-authenticates and continues. The cookie cache is a pure optimisation that saves
a round trip; deleting it changes nothing but performance.

The cache lives at `~/.cache/recipe-cli/session-<hash of RECIPE_API_URL>`, mode `0600`,
overridable with `RECIPE_SESSION_FILE`. It is keyed by URL so a dev and a production target
never share a session. It holds one cookie string and nothing else.

Guard against a retry loop: the login call itself never triggers the retry path.

**CORS is not a problem.** The whitelist check in
[`api/src/index.ts:29-38`](api/src/index.ts#L29-L38) allows requests with no `Origin` header,
and a CLI sends none. No whitelist entry is needed.

**Permissions matter.** `nutritionalInfoCreateOne` requires the ingredient's owner or an
admin ([`api/src/schema/NutritionalInfo.ts:9-32`](api/src/schema/NutritionalInfo.ts#L9-L32)),
and `ingredientUpdateById` runs behind `isDocumentOwnerOrAdmin(Ingredient)`. An agent
processing ingredients it does not own must be configured with an admin account. The
transparent retry above never rescues this: the credentials are valid, the role is wrong, so
re-authenticating returns the same `FORBIDDEN`. Retry only on `UNAUTHENTICATED`, never on
`FORBIDDEN`. `recipe auth status` prints the role so this fails loudly and early rather than
part-way through a bulk run.

### 3. Table output by default, `--json` for machines

Human-readable tables are the default. Agents pass `--json`.

oclif supports this directly through `enableJsonFlag`, which adds the `--json` flag,
suppresses all other stdout when it is set, and serialises the command's return value. This
removes a class of bug where a stray log line corrupts an agent's parse.

### 4. oclif

oclif provides subcommand routing, topic grouping, generated help, the `--json` handling
above, and a test harness. The alternative — hand-rolled `parseArgs` — would mean writing and
maintaining help text that an agent depends on for discovery.

### 5. GraphQL codegen by introspection, exactly as the client does

Types are generated with `@graphql-codegen/cli`, following `client/codegen.ts` in shape.

`cli/codegen.ts` introspects a live API, reading the URL from an environment variable via
`dotenv-flow`, and writes to a gitignored `src/graphql/__generated__/`. This is the same
arrangement AGENTS.md already documents for the client, including the requirement that the
API be running. An agent that finds the directory missing starts the dev server and runs
`npm run generate`, which is a step it already performs for the client.

```typescript
// cli/codegen.ts
import 'dotenv-flow/config';
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: process.env.RECIPE_API_URL,
    documents: ['src/**/*.ts'],
    generates: {
        './src/graphql/__generated__/': {
            preset: 'client',
            config: { enumsAsConst: true, nonOptionalTypename: true },
            presetConfig: { gqlTagName: 'gql', fragmentMasking: false },
        },
    },
    ignoreNoDocuments: false,
};

export default config;
```

Scripts mirror the client's: `generate`, `generate:test`, and `rm-generated`.

`RECIPE_API_URL` serves both codegen and the runtime transport, so one variable configures
the whole tool.

### 6. Two safety mechanisms: `--dry-run` and `--overwrite`

**`--dry-run`** is accepted by every write command. It resolves everything, prints the exact
mutation variables that would be sent, and sends nothing. An agent can be told to plan first,
and the operator reviews before a real run.

**`--overwrite`** guards existing data. `nutrition link` refuses to replace an existing
`NutritionalInfo` unless the flag is present. It exits 5 and names the current link:

```text
$ recipe nutrition link "olive oil" --fdc-id 748608
Error: olive oil already has nutritional data (usdaFdcId 171413, linked per-gram
       and per-unit). Pass --overwrite to replace it.
```

This matters most for an unattended bulk run. Without it, an agent that misjudges one match
silently destroys a value a human entered by hand, and nothing records what was there before.
With it, the refusal is visible in the agent's output and the operator decides.

`--overwrite` is required for a **replacement**, never for a first link. An agent working
through ingredients that have no data never needs the flag, so its presence in a command line
is itself a signal that something is being changed rather than filled in.

When the flag is given, the command prints the previous values alongside the new ones, so the
change is legible after the fact.

The same guard applies to `--set-density` on an ingredient whose `density` is already set.

Deliberately **not** included for v1: a JSONL audit log, and named environment profiles with
guard rails.

## Project layout

```text
cli/
  package.json          name: recipe-cli, bin: { "recipe": "./bin/run.js" }
  bin/run.js            oclif entry point
  tsconfig.json         mirrors api/tsconfig.json (nodenext, es2020, ESM)
  codegen.ts            introspects RECIPE_API_URL, mirrors client/codegen.ts
  .eslintrc.cjs         mirrors api/.eslintrc.cjs
  .env.development.local   gitignored, mirrors api/ and client/
  README.md             human docs
  AGENTS.md             agent-facing usage, see "Documentation"
  src/
    constants.ts        dotenv-flow + typed exports, mirrors api/src/constants.ts
    graphql/
      client.ts         fetch transport; authenticates and retries via session.ts
      operations.ts     query and mutation documents
      __generated__/    codegen output, gitignored
    lib/
      session.ts        cookie cache, transparent login and one-shot retry
      resolve.ts        ingredient and recipe identifier resolution
      format.ts         table rendering, JSON envelope
      errors.ts         error classes mapped to exit codes
    commands/
      auth/logout.ts  auth/status.ts
      recipes/list.ts  recipes/show.ts
      ingredients/list.ts  ingredients/show.ts
      usda/search.ts  usda/show.ts
      nutrition/link.ts  nutrition/unlink.ts  nutrition/status.ts
  test/
```

**Topic naming.** The binary is `recipe`, so a topic also named `recipe` would read
`recipe recipe show tomato-soup-a4f2k`. Entity topics are therefore plural:

```text
recipe recipes show tomato-soup-a4f2k     not  recipe recipe show ...
recipe ingredients list                   not  recipe ingredient list
```

Topics that are not collections stay singular: `auth`, `usda`, `nutrition`. Swap the entity
topics back to singular if the repetition does not bother you; nothing else depends on it.

Add `cli/node_modules`, `cli/dist`, `cli/src/graphql/__generated__` to `.gitignore`, and
`cli/dist` to `.prettierignore`. The `.env.*.local` names are already covered.

## Configuration

`cli/src/constants.ts` mirrors `api/src/constants.ts`: import `dotenv-flow/config`, read
`process.env`, export typed constants, and throw at startup if a required value is missing.

| Variable | Required | Meaning |
| --- | --- | --- |
| `RECIPE_API_URL` | yes | GraphQL endpoint; also read by `codegen.ts` |
| `RECIPE_USERNAME` | yes | account the CLI authenticates as |
| `RECIPE_PASSWORD` | yes | its password |
| `RECIPE_SESSION_FILE` | no | override the session cache path |

Files, all matched by the existing root `.gitignore`:

```text
cli/.env.development.local     local API, your admin account
cli/.env.test.local            CI
cli/.env.production.local      the live API — see the warning below
```

`--url` remains as a per-command flag, above the environment variable, for a one-off against
a different server. Precedence: flag, then environment, then env file.

There is no `--password` flag. A password in `argv` lands in shell history and in the process
list, and the env file already covers the case. This differs from the earlier draft
deliberately.

> **Targeting production.** `NODE_ENV=production recipe ...` points bulk writes at the live
> database. That is a real capability with no extra guard beyond `--dry-run` and
> `--overwrite`. Say so plainly in `cli/README.md`.

## Command surface

Authentication happens automatically on any command, so there is no login step. The `auth`
topic exists for diagnostics.

### `recipe auth status`

Authenticates if needed, then calls `currentUser`.

```text
URL       http://localhost:4000/   (development)
User      matt
Role      admin
Session   cached
```

The role line is the point of this command. A non-admin account reads everything and then
fails on the first write it attempts against an ingredient it does not own. Running this
first turns that into one clear message instead of a partial bulk run.

Exit 3 when the configured credentials are rejected, naming the variable to check rather
than a login command that no longer exists.

### `recipe auth logout`

Calls the `logout` mutation and deletes the cached cookie. The next command authenticates
again, so this is for invalidating a server-side session, not for signing out.

### `recipe recipes list`

Flags: `--search TEXT`, `--limit N` (default 25), `--offset N`.

```text
IDENTIFIER              TITLE                    INGREDIENTS  LINKED
tomato-soup-a4f2k       Tomato soup              8            6
roast-chicken-9dk2p     Roast chicken            12           12
```

`LINKED` counts ingredients that have a `NutritionalInfo` record. This is the column that
tells an agent where the work is.

### `recipe recipes show <identifier>`

Accepts a `titleIdentifier` or a MongoID. Lists every ingredient across all
`ingredientSubsections`, with quantity, unit, and nutrition state.

```text
Tomato soup (tomato-soup-a4f2k)

  QUANTITY  UNIT  INGREDIENT       NUTRITION   REASON
  400       g     tomato           linked
  1         cup   stock            missing     no nutritional data
  2         tbsp  olive oil        linked
  1               onion            partial     no per-unit data
```

`REASON` mirrors the messages in
[`client/src/utils/nutrition.ts`](client/src/utils/nutrition.ts#L100-L190) so the CLI and the
web UI describe the same gap in the same words. `partial` means a `NutritionalInfo` exists
but does not cover how this recipe measures the ingredient.

Recipe ingredients whose `type` is `recipe` rather than `ingredient` are listed and marked as
such. They are not linkable.

### `recipe ingredients list`

Flags: `--missing-nutrition`, `--recipe IDENTIFIER`, `--limit N`, `--offset N`.

`--missing-nutrition` is the main entry point for a bulk run. There is no server-side filter
for it, so the command fetches ingredients via `ingredientManyAll` and their nutrition via
`nutritionalInfosByIngredientIds`, then diffs locally. Two requests, regardless of count.

```text
ID                        NAME         COUNTABLE  DENSITY  NUTRITION
65f1a2b3c4d5e6f708192a3b  stock        no         —        missing
65f1a2b3c4d5e6f708192a3c  onion        yes        —        missing
```

### `recipe ingredients show <name|id>`

Full detail for one ingredient: fields, its `NutritionalInfo` if any, the linked
`usdaFdcId`, and which recipes use it.

### `recipe usda search <query>`

Flags: `--page-size N` (default 20, server caps at 200).

```text
FDCID    DESCRIPTION                        BRAND   KCAL   PROT  CARB  FAT
171413   oil, olive, salad or cooking       —       884.0  0.0   0.0   100.0
748608   olive oil                          —       800.0  0.0   0.0   93.3
```

Values are per 100 g, matching the resolver's field names.
`portions` is always empty here — see `spec-usda-portions.md`.

### `recipe usda show <fdcId>`

Calls `usdaFoodItem`, which returns portions after `spec-usda-portions.md` lands. This is the
command an agent uses to judge a candidate before linking.

```text
egg, whole, raw, fresh (171287)  ·  SR Legacy
Per 100 g: 143.0 kcal · 12.6 g protein · 0.7 g carbs · 9.5 g fat

PORTIONS
  #  DESCRIPTION              KIND     GRAMS  ML      DENSITY  FLAGS
  1  1 large                  item      50.0  —       —
  2  1 extra large            item      56.0  —       —
  3  1 jumbo                  item      63.0  —       —
  4  1 medium                 item      44.0  —       —
  5  1 small                  item      38.0  —       —
  6  1 cup (4.86 large eggs)  volume   243.0  236.59  1.027    ambiguous

  5 item portions. Only item portions can supply --portion.
```

`KIND` is the column that prevents the worst error. Passing `--portion 6` above would set
`perUnit` to 243 g — nearly five eggs — so the command refuses any portion that is not
`item`. The `FLAGS` column marks portions whose label needs reading: `NLEA serving`,
`1 lemon yields`, and `slice` all look like items and are not one whole thing.

When a record has no `item` portions, which the sample in `spec-usda-portions.md` puts at
roughly a third of foods, the footer says so plainly rather than printing an empty table.

### `recipe nutrition link <ingredient> --fdc-id <n>`

The core command.

Flags:

| Flag | Effect |
| --- | --- |
| `--fdc-id N` | required; the USDA item to link |
| `--portion LABEL\|INDEX` | derive `perUnit` from this portion; must be kind ITEM |
| `--set-density` | also write the implied density to `Ingredient.density` |
| `--allow-ambiguous-density` | permit `--set-density` from an ambiguous portion |
| `--overwrite` | permit replacing existing nutritional data or an existing density |
| `--dry-run` | resolve and print, send nothing |

Behaviour:

1. Resolve `<ingredient>` to an id (exact name or MongoID). An ambiguous name exits 4 and
   lists the candidates.
2. Fetch `usdaFoodItem(fdcId)`. A missing item exits 4.
3. `perGram` = each `*Per100g` value divided by 100.
4. With `--portion`, `perUnit` = `perGram × gramWeight`. Match the flag against the portion
   `description` or its 1-based index from `usda show`.

   **Refuse a portion whose `kind` is not `ITEM`**, exit 6, and name the kind. A `VOLUME`
   portion such as `cup (4.86 large eggs)` would overstate one egg roughly fivefold, and a
   `SERVING` portion such as garlic's 85 g RACC by more than an order of magnitude. See the
   evidence in `spec-usda-portions.md`.

   Warn, but proceed, when the chosen `ITEM` portion is `ambiguous`.
5. Without `--portion`, on an ingredient where `isCountable` is true, warn that `perUnit` is
   unset and the ingredient stays uncalculable when used without a unit. Proceed anyway, so
   an agent can make a second pass.

   Distinguish the two reasons in the warning, because they need different fixes. Either the
   record offers `ITEM` portions and none was chosen, or it offers none at all — which the
   sample in `spec-usda-portions.md` puts at roughly a third of foods. The second case needs
   a different USDA record or manual entry, not a retry with `--portion`.
6. With `--set-density`, write `Ingredient.density` from the chosen portion's
   `impliedDensity` via `ingredientUpdateById`. Refuse when the only candidate portion is
   `ambiguous`, unless `--allow-ambiguous-density` is also given. Refuse when the ingredient
   already has a density, unless `--overwrite` is also given. Never write a density without
   `--set-density`; this mirrors decision 2 of `spec-usda-portions.md`.

   The CLI writes density with an explicit mutation because it has no form. The web client
   routes the same suggestion through its ingredient form field instead. Both consume the
   same server-derived `impliedDensity`.
7. Query the existing `NutritionalInfo` for the ingredient **before** writing.
   - None exists → create it with `nutritionalInfoCreateOne`.
   - One exists and `--overwrite` was not given → exit 5, naming the current `usdaFdcId` and
     which of `perGram` and `perUnit` are populated. Write nothing.
   - One exists and `--overwrite` was given → update it with `nutritionalInfoUpdateById` and
     print the previous values beside the new ones.

   Under `--dry-run`, this check still runs, so a dry run reports the conflict rather than
   describing a write that would in fact be refused.

```text
$ recipe nutrition link "olive oil" --fdc-id 171413 --set-density --dry-run

DRY RUN — nothing was sent.

Ingredient   olive oil (65f1a2b3c4d5e6f708192a40)
USDA item    oil, olive, salad or cooking (171413)

Would create NutritionalInfo:
  ingredient  65f1a2b3c4d5e6f708192a40
  usdaFdcId   171413
  perGram     { calories: 8.84, protein: 0, carbs: 0, fat: 1 }

Would update Ingredient.density:
  from  (unset)
  to    0.913   (from portion "1 cup" = 216 g)
```

### `recipe nutrition unlink <ingredient>`

Removes the `NutritionalInfo` with `nutritionalInfoRemoveById`. Prints what it removed.
Supports `--dry-run`. Does not touch `Ingredient.density`.

### `recipe nutrition status`

Flags: `--recipe IDENTIFIER`.

A coverage report. Without `--recipe`, it covers every ingredient. With it, one recipe.

```text
Ingredients        42
  linked           31   (74%)
  missing          11
  countable without per-unit    4
  volume-used without density   3
```

## Output contract

With `--json`, every command prints one object and nothing else:

```json
{ "ok": true, "data": { }, "warnings": [] }
```

On failure:

```json
{ "ok": false, "error": { "code": "NOT_AUTHENTICATED", "message": "..." } }
```

Exit codes:

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | runtime or network error |
| 2 | usage error (oclif default) |
| 3 | not authenticated, or insufficient role |
| 4 | not found, or an ambiguous identifier |
| 5 | refused: existing data would be replaced, and `--overwrite` was not given |
| 6 | server rejected the write (validation) |

GraphQL errors are mapped by their `extensions.code`: `UNAUTHENTICATED` and `FORBIDDEN` → 3,
`NOT_FOUND` → 4, `BAD_USER_INPUT` → 6.

Code 5 is raised by the CLI itself, before any mutation is sent. It is separated from code 6
so an agent can tell "you need a flag" apart from "the server said no", and retry only the
first. In `--json` mode the error code is `WOULD_OVERWRITE`, and `error.existing` carries the
current values so the agent can weigh the replacement without a second query.

## Rate limiting

USDA calls pass through the API, so they consume the server's key quota — 1000 requests per
hour on a production key. A bulk agent run can exhaust that.

- Issue requests sequentially. No parallelism in v1.
- On a `USDA API error: 429` response, retry three times with exponential backoff, then fail
  the command with a message naming the quota.
- Cache `usdaFoodItem` responses in memory for the lifetime of one process, so
  `usda show` followed by `nutrition link` on the same `fdcId` costs one upstream call.

## Testing

Use mocha and chai, matching `api/`. oclif's default test setup already uses them.

- **Transport and session:** cookie captured from `Set-Cookie`, sent on later requests,
  cache written with mode 0600, GraphQL error codes mapped to the right exit codes.
- **Transparent login:** a command with no cached cookie authenticates and succeeds; a cached
  cookie is reused without a second login; an `UNAUTHENTICATED` response triggers exactly one
  re-login and retry; a second failure exits 3 rather than looping; the login call itself
  never recurses. Assert the request count, not just the outcome.
- **Constants:** a missing `RECIPE_API_URL`, `RECIPE_USERNAME` or `RECIPE_PASSWORD` fails at
  startup with a message naming the variable.
- **Commands:** stub `global.fetch` with canned GraphQL responses, as
  [`api/test/graphql/NutritionalInfo.test.ts:506`](api/test/graphql/NutritionalInfo.test.ts#L506)
  does. Use `@oclif/test`'s `runCommand` and assert on both table and `--json` output.
- **`nutrition link`:** `perGram` arithmetic, `perUnit` from a named portion and from an
  index, the countable-without-portion warning, and `--set-density` refusing an ambiguous
  portion.
- **`--portion` rejects non-item portions.** Passing egg 171287's `cup (4.86 large eggs)`
  exits 6 and sends no mutation. Passing garlic 1104647's RACC portion does the same. These
  two guard the fivefold and order-of-magnitude errors documented in
  `spec-usda-portions.md`; without them a bulk run writes plausible, wrong numbers.
- **No item portions available:** olive oil 171413 produces the "no per-item portion"
  warning, distinct from the "portions exist, none chosen" warning.
- **`--dry-run` issues no mutation.** Assert that fetch was called for the reads and never
  for the mutation. This is the most important test in the suite.
- **`--overwrite`:** linking an ingredient that already has a `NutritionalInfo` exits 5 and
  sends no mutation; the same call with `--overwrite` sends `nutritionalInfoUpdateById` and
  reports the previous values; a first link needs no flag; `--set-density` against an
  existing density exits 5; `--dry-run` on a conflict reports the conflict rather than a
  would-be write; `--json` output carries `WOULD_OVERWRITE` and `error.existing`.
- **Identifier resolution:** exact name, MongoID, ambiguous name exits 4, unknown exits 4.

## CI

Add a `cli` section to the existing `test` job in `.github/workflows/deploy.yml`, after the
API steps:

1. `npm install` in `cli/`.
2. `npm run generate:test`, `npm run lint`, `npm run build`, `npm test` in `cli/`.

The workflow already starts the API in test mode before running client codegen. Place the CLI
steps after that, so both projects introspect the same running server.

The CLI is a development tool, so it is not added to the `deploy` job.

## Documentation

- `cli/README.md` — install (`npm install && npm run build && npm link`), configure, and the
  command reference.
- **`AGENTS.md` at the root must be updated.** It currently states "Two independent Node.js
  projects in one git repo" and lists only `api/` and `client/`. Add `cli/` to the structure,
  the tech stack table, and the Commands section.
- `cli/AGENTS.md` — the agent-facing document. It should carry the canonical workflow
  verbatim, because this is what an agent reads before a bulk run:

```text
1. recipe auth status                                    confirm admin role
   (no login step: commands authenticate themselves)
2. recipe recipes show <identifier> --json               find gaps
3. for each ingredient marked missing:
     recipe usda search "<name>" --json                  candidates
     recipe usda show <fdcId> --json                     macros and portions
     recipe nutrition link <id> --fdc-id <n> \
       [--portion "<label>"] [--set-density] --dry-run   plan
4. review the planned writes
5. re-run step 3 without --dry-run
6. recipe nutrition status --recipe <identifier>         confirm coverage

Exit code 5 means the ingredient already has data. Do NOT add --overwrite on your
own. Report it and let the operator decide, because that data may have been
entered by hand.
```

It must also carry the judgement rules below. These are not style advice. Each one was
derived from a real error found while sampling the API, recorded in
`spec-usda-portions.md`.

**Choosing the record — this matters more than choosing the portion.**

- Read the full description before accepting a hit. Sampling found `chicken breast meat only
  raw` returning **Pheasant, breast** and `lemons raw` returning **Lemon juice, raw**.
- Watch for qualifiers that change the size of the thing. *Squash, zucchini, **baby**, raw*
  gives `1 large = 16 g`; the ordinary record gives `323 g`. A twentyfold error, invisible in
  the portion data.
- Prefer Foundation and SR Legacy over Branded for generic ingredients.
- Match the preparation state: raw against raw, cooked against cooked.

**Choosing the portion.**

- Only `kind: ITEM` portions can supply `perUnit`. The CLI refuses the others, so do not try
  to force one through.
- Roughly a third of foods offer no `ITEM` portion at all. When that happens, look for a
  better record before giving up. If none exists, link `perGram` only and report the
  ingredient as needing manual per-unit entry. Do not invent a gram weight.
- The `ambiguous` flag means read the label carefully. `NLEA serving`, `1 lemon yields`, and
  `slice` all count like items and are not one whole item.
- When several sizes exist — egg spans 38 g to 63 g, onion 70 g to 150 g — pick the one a
  recipe writer would mean, usually medium or large. State which you picked.

## Build phases

Phase 0 is a hard prerequisite. Phases 2a and 2b can run in parallel once phase 1 lands.

| Phase | Work | Depends on | Done when |
| --- | --- | --- | --- |
| 0 | Implement `spec-usda-portions.md` | — | portions available from `usdaFoodItem` |
| 1 | Scaffold: `cli/` project, oclif, tsconfig, lint, codegen wiring, `constants.ts`, GraphQL transport, session cache, `auth` commands | 0 | `recipe auth status` works against a local API with no prior login |
| 2a | `recipes list`, `recipes show`, `ingredients list`, `ingredients show` | 1 | `--missing-nutrition` lists the gaps in a real database |
| 2b | `usda search`, `usda show` | 1 | `usda show 171413` prints the portion table |
| 3 | `nutrition link`, `nutrition unlink`, `nutrition status` | 2a, 2b | a real ingredient links end to end, and `--dry-run` sends nothing |
| 4 | `cli/README.md`, `cli/AGENTS.md`, root `AGENTS.md` update, CI job | 3 | CI green |

Phase 1 is the integration risk and should not be split across agents. It settles the
transport, the config format, the error mapping and the output envelope that every later
command depends on.

## Definition of done

- [ ] `cli/` builds and `npm link` puts `recipe` on the path.
- [ ] A first command with no cached session authenticates on its own and succeeds.
- [ ] `recipe auth status` reports the role, and an expired session is re-established
      mid-run without operator action.
- [ ] Configuration comes from `cli/.env.<mode>.local`; no JSON config file exists.
- [ ] `recipe ingredients list --missing-nutrition --json` returns parseable JSON.
- [ ] `recipe usda show <fdcId>` prints portions with implied densities.
- [ ] `recipe nutrition link` creates a `NutritionalInfo` with correct `perGram`, and with
      `perUnit` when `--portion` names a portion of kind `item`.
- [ ] `--portion` refuses a `volume` or `serving` portion, exits 6, and writes nothing.
- [ ] `usda show` prints a `KIND` column and says so when a record has no `item` portions.
- [ ] `--dry-run` provably sends no mutation, asserted by a test.
- [ ] `nutrition link` on an ingredient that already has data exits 5 and writes nothing;
      `--overwrite` replaces it and prints the previous values.
- [ ] `--set-density` writes `Ingredient.density`, and refuses ambiguous portions without
      the override flag, and an existing density without `--overwrite`.
- [ ] Every exit code in the table is produced by at least one test.
- [ ] `cd cli && npm run lint && npm run build && npm test` all pass.
- [ ] `npm run generate` in `cli/` produces types against a running API.
- [ ] Root `AGENTS.md` describes three projects, not two.
