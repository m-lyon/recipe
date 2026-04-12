# AGENTS.md

Guidance for AI agents working on this codebase.

## Project Structure

Two independent Node.js projects in one git repo. No root `package.json` or monorepo tooling.

```
api/          # Express + Apollo Server + Mongoose (Node backend)
client/       # React + Vite + Apollo Client (frontend SPA)
.github/      # CI/CD workflows
```

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| API server | Express 4 + Apollo Server 4 |
| API GraphQL | graphql-compose + graphql-compose-mongoose (auto-CRUD from Mongoose models) |
| Database | MongoDB via Mongoose 7 |
| Auth | Passport + passport-local-mongoose (session-based) |
| Client framework | React 18 + TypeScript |
| Client build | Vite 6 |
| Client GraphQL | Apollo Client 3 |
| Client UI | Chakra UI 2 **and** Mantine 8 (both used simultaneously) |
| Client state | Zustand 5 (slice pattern) |
| Client routing | react-router-dom 6 |

## Commands

### API (`cd api/`)

| Task | Command |
| ---- | ------- |
| Install deps | `npm install` |
| Compile TS | `npm run compile` |
| Run tests | `npm test` (compiles first, then runs mocha) |
| Type check | `npm run check-types` |
| Dev server | `npm run dev` |
| Start server | `NODE_ENV=development node ./dist/src/index.js` |

There is **no lint script** in the API. ESLint config exists but there is no `npm run lint`.

### Client (`cd client/`)

| Task | Command |
| ---- | ------- |
| Install deps | `npm install` |
| Lint | `npm run lint` |
| Fix formatting | `npm run lint -- --fix` |
| Run tests | `npm test` (vitest, watch mode) |
| Run tests once | `npm test -- run` |
| Type check | `npm run check-types` |
| Codegen | `npm run generate` (requires running API, see below) |
| Build | `npm run build` |
| Dev server | `npm run dev` |

## Running Tests

### API tests

```bash
cd api && npm test
```

- Uses **Mocha** + **Chai** with **mongodb-memory-server** (in-memory MongoDB).
- TypeScript compiles to `dist/` first, then mocha runs the JS.
- Tests at `api/test/graphql/*.test.ts` (resolver-level) and `api/test/mongoose/*.test.ts` (model-level).
- Pattern: `before(startServer)` / `after(stopServer)` / `beforeEach(createData)` / `afterEach(removeData)`.
- Tests call `context.apolloServer.executeOperation()` with `contextValue` for auth mocking.

### Client tests

```bash
cd client && npm test -- run
```

- Uses **Vitest** + **@testing-library/react** + **happy-dom**.
- Test timeout: 15000ms.
- Integration tests at `client/src/__tests__/index.*.test.tsx`.
- Page tests at `client/src/pages/__tests__/*.test.tsx`.
- Zustand stores auto-reset between tests via the mock at `client/__mocks__/zustand.ts`.
- Apollo mocking uses `MockedProvider` with per-test mock arrays.
- Browser tests (`*.browser.test.tsx`) use Playwright and are currently flaky/disabled in CI.

### Pre-existing test failures

These fail on `main` and are not caused by your changes:

- `EditableIngredient.browser.test.tsx` -- browser mode config issue.

## GraphQL Codegen

The client uses `@graphql-codegen/cli` to generate TypeScript types from the API schema via introspection. **This requires the API to be running.**

```bash
# 1. Start the API (must be on port 4004 for test/dev)
cd api && npm install && npm run compile
NODE_ENV=development node ./dist/src/index.js &

# 2. Run codegen
cd client && npm run generate
```

- Output goes to `client/src/__generated__/` (gitignored).
- After any GraphQL schema change (queries, mutations, fragments), you must re-run codegen.
- In CI, `npm run generate:test` is used with the API started in test mode.

## Code Conventions

### Formatting (Prettier via ESLint)

- Single quotes, JSX single quotes
- 4-space indentation
- 100 char print width
- Trailing commas (es5)

### Import ordering (enforced by ESLint)

1. Builtin modules
2. External packages
3. Internal (`@recipe/**`)
4. Sibling/parent
5. Index

Blank line between each group. `@recipe/**` imports are grouped after externals.

### Client path aliases

All aliases resolve from `client/src/`:

| Alias | Path |
| ----- | ---- |
| `@recipe/graphql/*` | `graphql/*` |
| `@recipe/graphql/generated` | `__generated__/graphql` |
| `@recipe/features/*` | `features/*` |
| `@recipe/utils/*` | `utils/*` |
| `@recipe/layouts` | `layouts` |
| `@recipe/stores` | `stores` |
| `@recipe/constants` | `constants.ts` |
| `@recipe/common/components` | `common/components` |
| `@recipe/common/hooks` | `common/hooks` |
| `@recipe/common/icons` | `common/icons` |

Vite resolves these automatically via `vite-tsconfig-paths`.

### Feature module pattern (client)

Features live in `client/src/features/<name>/` with subdirectories for `components/`, `hooks/`, `utils/`, and a barrel `index.tsx`.

**Deep imports into features are ESLint-blocked.** You must import through the barrel:

```typescript
// Good
import { SearchBar } from '@recipe/features/search';

// Bad -- ESLint error
import { SearchBar } from '@recipe/features/search/components/SearchBar';
```

### GraphQL mock data (client)

Each `graphql/mutations/<entity>.ts` and `graphql/queries/<entity>.ts` has a parallel `__mocks__/<entity>.ts` with test fixtures. Default mocks for integration tests are composed in `src/__mocks__/graphql.ts`.

When adding a new field to a query/mutation, update the corresponding `__mocks__` file with the field in all mock objects.

### API resolver pattern (graphql-compose)

1. Define Mongoose model + schema in `api/src/models/`.
2. `composeMongoose()` generates a TypeComposer (TC) with auto-CRUD resolvers.
3. Custom resolvers added via `TC.addResolver()` in `api/src/schema/<Entity>.ts`.
4. Authorization applied via `composeResolvers()` in `api/src/schema/index.ts`.
5. Authorization layers: `isAdmin`, `isVerified`, `isDocumentOwnerOrAdmin(Model)`.

### Global types (client)

`client/src/types/recipe.d.ts` declares global TypeScript types derived from generated GraphQL types. These are available without imports (e.g., `RecipePreview`, `RecipeView`, `EditableRecipeIngredient`).

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`) on push to `main`:

1. **test job**: Install both projects, run API tests (mocha), start API, run codegen, run client tests (vitest).
2. **deploy job**: Compile API (prod), build client, deploy both via SSH/rsync.

## Common Pitfalls

- **Forgetting codegen**: After changing GraphQL operations (queries, mutations, fragments), run `npm run generate` in `client/`. The `__generated__/` directory is gitignored and must be regenerated.
- **Codegen needs a running API**: The codegen config introspects the schema from a live server. Start the API first.
- **API tests require compilation**: `npm test` compiles TS to `dist/` then runs mocha on JS files. If you edit `.ts` files, the tests always recompile.
- **Dual `useSearch` hook instances**: Both `Navbar` and `RecipeCardsContainer` call `useSearch()`, creating separate `useLazyQuery` instances. Apollo mocks for search queries may need to be provided twice.
- **Apollo cache `keyArgs: []`**: `recipeMany` and `recipeCount` have `keyArgs: []` in the cache config (`client/src/utils/cache.ts`), meaning all queries of each type share a single cache entry regardless of filter/pagination args.
- **Mock recipe display names**: `mockRecipeTwo` has `isIngredient: true`, so `getCardTitle()` returns `pluralTitle` not `title`. Use `aria-label` to find card elements in tests.
