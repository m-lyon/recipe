# recipe-cli

A command line tool for querying and modifying the recipe database. Its first use case is linking USDA food items to existing ingredients in bulk.

See [AGENTS.md](AGENTS.md) for the agent-facing workflow and the judgement rules.

## Install

```bash
cd cli
npm install
# The API must be running: codegen introspects its schema.
npm run generate
npm run build
npm link            # puts `recipe` on your PATH
```

## Configure

Configuration is provided via `.env.<mode>.local` files read through `dotenv-flow`.

```text
cli/.env.development.local     local API, your admin account
cli/.env.test.local            CI
cli/.env.production.local      the live API — see the warning below
```

| Variable | Required | Meaning |
| --- | --- | --- |
| `RECIPE_API_URL` | yes | GraphQL endpoint; also read by `codegen.ts` |
| `RECIPE_USERNAME` | yes | account the CLI authenticates as |
| `RECIPE_PASSWORD` | yes | its password |
| `RECIPE_SESSION_FILE` | no | override the session cache path |
| `RECIPE_USDA_CACHE_DIR` | no | override the USDA record cache directory |

```text
cli/.env.development.local
  RECIPE_API_URL = http://localhost:4004/
  RECIPE_USERNAME = matt
  RECIPE_PASSWORD = ...
```

`--url` is a per-command flag for a one-off against a different server. Precedence: flag, then environment variable, then env file.

> **Targeting production.** `NODE_ENV=production recipe ...` points bulk writes at the live
> database.

## Authentication

There is no login step. Every command runs through one transport wrapper, which:

1. sends the cached `connect.sid` cookie when it has one;
2. calls the `login` mutation when it has none, or when the API answers `UNAUTHENTICATED`, and retries the original operation **once**;
3. treats a second failure as a real authentication error and exits 3.

The cookie cache lives at `~/.cache/recipe-cli/session-<hash of RECIPE_API_URL>`, mode
`0600`, overridable with `RECIPE_SESSION_FILE`.

## Commands

| Command | What it does |
| --- | --- |
| `recipe auth status` | endpoint, account and **role**; the check to run first |
| `recipe auth logout` | invalidates the server session and deletes the cached cookie |
| `recipe recipes list` | recipes with an ingredient count and a linked count |
| `recipe recipes show <identifier>` | every ingredient, with its nutrition state and reason |
| `recipe ingredients list` | ingredients; `--missing-nutrition` shows the gaps |
| `recipe ingredients show <name\|id>` | one ingredient in full, and the recipes using it |
| `recipe usda search <query>` | USDA search; values are per 100 g, portions are empty |
| `recipe usda show <fdcId>` | macros and the **portion table**; judge a candidate here |
| `recipe nutrition link <ingredient> --fdc-id <n>` | the core command |
| `recipe nutrition unlink <ingredient>` | removes the `NutritionalInfo` |
| `recipe nutrition status` | a coverage report |

Run `recipe <topic> <command> --help` for the flags.

### Output

Human-readable tables are the default. Pass `--json` for one object and nothing else:

```json
{ "ok": true, "data": {}, "warnings": [] }
```

On failure:

```json
{ "ok": false, "error": { "code": "WOULD_OVERWRITE", "message": "..." } }
```

### Safety

**`--dry-run`** is accepted by every write command. It resolves everything, prints the exact mutation variables that would be sent, and sends nothing.

**`--overwrite`** guards existing data. `nutrition link` refuses to replace an existing `NutritionalInfo`, and refuses to replace an existing `Ingredient.density`, unless the flag is present. It exits 5 and names what is there now.

`--overwrite` is required for a **replacement**. Its presence in a command line is itself a signal that something is being changed rather than filled in.

### Exit codes

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | runtime or network error |
| 2 | usage error |
| 3 | not authenticated, or insufficient role |
| 4 | not found, or an ambiguous identifier |
| 5 | refused: existing data would be replaced, and `--overwrite` was not given |
| 6 | the write was rejected: a non-item portion, a bad argument, or server validation |

GraphQL errors are mapped by their `extensions.code`: `UNAUTHENTICATED` and `FORBIDDEN` → 3, `NOT_FOUND` → 4, `BAD_USER_INPUT` and `GRAPHQL_VALIDATION_FAILED` → 6.

Code 5 is raised by the CLI itself, before any mutation is sent, so an agent can tell "you need a flag" apart from "the server said no" and retry only the first.

## Rate limiting and the USDA cache

USDA calls pass through the API and consume the server's key quota — 1000 requests per hour on a production key.

- Requests are issued sequentially. There is no parallelism.
- A `USDA API error: 429` is retried three times with exponential backoff, then the command fails with a message naming the quota.
- `usdaFoodItem` responses are cached in memory for the lifetime of one process, and **on disk** between processes.

The disk cache is what makes a bulk run affordable. `usda show 171287`, a dry run against
that record and the write that follows are three separate processes reading one food. With
the cache they cost one upstream call instead of three.

```text
~/.cache/recipe-cli/usda/<fdcId>-<hash of the query>.json
```

- Override the directory with `RECIPE_USDA_CACHE_DIR`.
- Entries expire after 30 days. USDA records are effectively static, but the API's mapping of them is not, so an old entry is re-fetched rather than trusted forever.
- The key carries a hash of the GraphQL document, so editing the `UsdaFoodItem` operation invalidates every entry it wrote. A resolver change with an unchanged query is covered by the expiry, or by `--refresh`.
- `usda show` and `nutrition link` accept `--refresh` to ignore the cache and fetch again.
- `usda show --json` reports `fromCache`, so you can see which calls were free.
- The data is public, so the files carry no restrictive permissions. Deleting the directory is safe; it only costs upstream calls.

`usda search` results are **not** cached. Search is cheap to repeat and its results change
as USDA updates its index.

## Develop

```bash
npm run generate     # requires a running API
npm run lint
npm run build
npm test             # builds, then runs mocha
npm run check-types
```

Tests stub `global.fetch` with canned GraphQL responses, so they need neither an API nor a database. They do need `src/graphql/__generated__/`, which is what `npm run generate:test` produces in CI.

**Forgetting codegen is the common pitfall.** The generated `gql()` returns an empty document for a source string it has never seen. The transport detects that and tells you to run `npm run generate` rather than sending a malformed query.
