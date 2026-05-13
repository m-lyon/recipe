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
| `@recipe/theme` | `theme` |
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

## Chakra UI → Mantine Migration

The codebase is gradually moving from Chakra UI v2 to Mantine 8. Both libraries are active simultaneously. When writing new UI code, prefer Mantine. When styling Mantine components to match existing Chakra components, follow the guidance below.

### Discovering Chakra's rendered values

Chakra tokens are **not** the same as their rendered CSS. Always resolve them before using in Mantine:

| Chakra token | Rendered CSS | Notes |
| --- | --- | --- |
| `gray.400` | `#A0AEC0` | Default "dimmed" / placeholder text colour |
| `gray.800` | `#1A202C` | — |
| `chakra-body-text` (light mode) | `rgba(0, 0, 0, 0.64)` | Default `<Text>` colour; resolves via `gray.800` semantic token but the actual CSS variable is `rgba(0,0,0,0.64)` |
| `fontWeight='medium'` | `500` | Chakra `fontWeights.medium` |
| `fontSize` default / `md` | `1rem` | Chakra `fontSizes.md` |
| `colorScheme='teal'` (Checkbox) | fill `#319795` | Chakra `teal.500` |
| Checkbox tick colour | `#ffffff` | Chakra always renders a white tick on a coloured fill; use Mantine's `--checkbox-icon-color` |

To discover additional values, inspect the compiled Chakra theme files in `node_modules/@chakra-ui/theme/dist/foundations/`:

- `colors.js` — all palette hex values
- `typography.js` — `fontSizes`, `fontWeights`
- `index.js` — semantic tokens (e.g. `chakra-body-text`, `chakra-placeholder-color`)

### Applying Chakra-equivalent styles to Mantine components via a variant

Rather than repeating inline styles, centralise them as a named variant in `client/src/theme/index.ts`. Use **CSS Modules** (not inline `styles`) so you can leverage selector context like `[data-checked]`:

1. Create a CSS module (e.g. `client/src/utils/checkboxTheme.module.css`) that targets Mantine's Styles API selectors and data attributes.
2. Register the variant in `theme/index.ts` using `classNames` (function form) and `vars` for CSS custom-property overrides.
3. Apply only `variant='...'` at the call site — no inline `styles`, no conditional logic.

**Example — matching Chakra's `colorScheme='teal'` + `fontWeight='medium'` Checkbox:**

```css
/* checkboxTheme.module.css */
.label {
    color: #a0aec0;          /* gray.400 – unchecked */
    font-size: 1rem;          /* md */
    font-weight: 500;         /* medium */
}
.root[data-checked] .label {
    color: rgba(0, 0, 0, 0.64); /* chakra-body-text light mode */
}
```

```ts
// theme/index.ts
Checkbox: Checkbox.extend({
    classNames: (_theme, props) => {
        if (props.variant === 'chakra-style') {
            return { root: checkboxClasses.root, label: checkboxClasses.label };
        }
        return {};
    },
    vars: (_theme, props) => {
        if (props.variant === 'chakra-style') {
            return { root: { '--checkbox-color': '#319795', '--checkbox-icon-color': '#ffffff' } }; // teal.500, white tick
        }
        return { root: {} };
    },
}),
```

Mantine's `[data-checked]` attribute is set on the root element when the checkbox is checked, so CSS-only state-dependent label colours work without any JS conditionals.

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
- **`mockRecipeTwo` and `mockRecipeVeganCopy` share the same `_id` (`mockRecipeIdTwo`)**: Any `cache.writeFragment` that writes vegan-copy data will overwrite the `Recipe:mockRecipeIdTwo` cache node, corrupting `mockRecipeTwo`'s title from 'Mock Recipe Two' to 'Mock Recipe'. If a test starts from the home page and then triggers vegan-copy creation, this causes two cards to show 'View Mock Recipe'. Avoid starting such tests from the home page, or give the vegan copy a distinct ID.
- **`cache.modify` is overwritten by a subsequent network response**: `cache.modify` updates a normalized cache node directly, but if a query that includes the same fields fires *after* the modification (e.g. a fresh `GET_RECIPES` on home page navigation), Apollo normalizes the incoming response and overwrites the modified fields. In production this is not an issue because the user visits the home page before editing (so `GET_RECIPES` is already cached and not re-fetched). In tests that start mid-flow (e.g. directly on a create/edit page), the home page `GET_RECIPES` fires fresh on navigation and reverts `cache.modify` changes. Fix by providing a mock `GET_RECIPES` response that already contains the post-modification data.
- **`updateRecipeCache` increments `recipeCount` unconditionally**: The `increment` flag in `updateRecipeCache` (`client/src/features/editing/utils/update.ts`) increments `recipeCount` even when the new record is a vegan copy (and is therefore excluded from `recipeMany`). If the cache already has a `recipeCount`, this makes `hasMore = true` on the home page, triggering an unnecessary `fetchMore` request. Guard the increment the same way the `recipeMany` append is guarded (skip increment when `record.originalRecipe` is set).
- **Pre-existing unhandled rejections in `index.vegan.test.tsx`**: Several tests in this file produce `TypeError: Cannot set properties of undefined` unhandled rejections after test cleanup, originating from async Zustand store updates in `CreateVeganRecipe`'s `onCompleted` callback firing after the component unmounts. These are not test failures and are pre-existing; do not treat them as regressions.
- **`MockedProvider` consumes each mock once**: Apollo's `MockedProvider` uses each entry in the mocks array exactly once (unless `newData` is used). If a component fires the same query multiple times (e.g. on mount and after navigation), provide the mock twice in the array.

## Apollo Cache Patterns

### Updating cached data after a mutation

When a mutation changes server-side data that is already reflected in a cached query result, choose the right update strategy based on when the home page was last visited:

- **`cache.modify`**: Updates a specific normalized node in place. Correct when the node is already cached (user visited the relevant page before the mutation). Does **not** survive a subsequent network response for the same fields — if a query re-fires after the mutation, the incoming data overwrites the modification.
- **Refetch the query**: Simplest and most reliable. Use `refetchQueries` on the mutation or `cache.evict` to force a re-fetch. Preferred when the UI navigates away and re-fetches anyway.
- **Test mock alignment**: When testing `cache.modify` behaviour, ensure the test's `GET_RECIPES` (or equivalent) mock returns data that is consistent with the expected post-mutation state, because navigation to the home page fires a fresh query that normalizes over any prior `cache.modify`.

### `updateRecipeCache` and vegan copies

`updateRecipeCache` in `client/src/features/editing/utils/update.ts` is called from the `CREATE_RECIPE` mutation's `update` callback. It has two branches:

- **`isIngredient` path** (`storeFieldName === 'recipeMany:{"filter":{"isIngredient":true}}'`): adds the record to the ingredient dropdown cache.
- **Home-page path** (all other `storeFieldName` values): skips records where `record.originalRecipe` is set (vegan copies) to prevent them appearing on the home page.

The `recipeCount` increment at the bottom is currently unconditional — it should also be skipped for vegan copies.
