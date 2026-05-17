# Cache Redesign Handoff

## Context

This branch uncovered a broader cache-model issue while trying to make `recipeCount` safer.

The attempted partial fix was:

- key `recipeCount` by filter
- keep `recipeMany` shared across most filters
- narrow manual count updates to the unfiltered home-page count

That does **not** work safely in the current app because the UI relies on a shared `recipeMany` cache entry being overwritten by search and archived-view queries, while `RecipeCardsContainer` still reads `recipeData.recipeCount` from its original query result. If only `recipeCount` becomes filter-keyed, the list and count can diverge, which breaks `hasMore` and pagination semantics.

## Root Problem

Current behavior couples these two facts:

1. `recipeMany` is intentionally shared for most filters.
2. `RecipeCardsContainer` uses a fixed home-page `useQuery(GET_RECIPES, { filter: { archived: false, originalRecipe: null } ... })`, but search and archived toggles mutate the visible list via `useLazyQuery(GET_RECIPES)` and cache overwrites.

As a result, list state and count state are not independently swappable without redesigning both sides.

## Recommended Decision Points

There are three realistic implementation options.

### Option A: Leave cache model alone

- Keep current `recipeMany` and `recipeCount` cache policy.
- Avoid additional manual count hardening in this branch.
- Accept the existing shared-cache behavior.

### Option B: Full cache-model redesign

- Key **both** `recipeMany` and `recipeCount` by filter.
- Make the rendered list and count come from the same active query state.
- Revisit all archive/unarchive/delete/create cache modifiers to target the correct filtered entries or refetch.

### Option C: Refetch-driven counts/lists for filtered views

- Keep most of the existing shared cache model.
- Stop manually modifying counts for filtered views.
- Refetch the active list/count query after archive/unarchive/delete/create operations.
- Possibly leave home-page cache helpers in place only for the unfiltered default list.

## Concrete Sites To Review / Modify

These are the concrete code and test surfaces that will need review for **any** real cache fix, grouped by concern.

### 1. Core Apollo cache policy

- `client/src/utils/cache.ts`
  - `Query.fields.recipeMany`
  - `Query.fields.recipeCount`
  - This is the main policy decision point.

### 2. Components that read list/count state

- `client/src/features/viewing/components/RecipeCardsContainer.tsx`
  - fixed home-page `useQuery(GET_RECIPES, ...)`
  - `fetchMore(...)`
  - `hasMore={recipeData.recipeCount ? recipeData.recipeCount > recipes.length : false}`
  - This is the main site where list/count divergence becomes user-visible.

- `client/src/features/search/hooks/useSearch.tsx`
  - `useLazyQuery(GET_RECIPES)` for search and archived toggles
  - `reset()` and `resetToHome()` behavior
  - This is the other half of the current shared-cache model.

- `client/src/features/search/utils/filter.ts`
  - generates the effective filters used by `recipeMany` and `recipeCount`
  - important when deciding what “same query” means for cache keys.

### 3. Client cache helpers that manually mutate list/count state

- `client/src/features/editing/utils/update.ts`
  - `updateRecipeCache(...)`
  - `removeRecipeFromLists(...)`
  - `archiveRecipeCache(...)`
  - `deleteVeganRecipeCache(...)`
  - This is the main helper layer that would need retargeting if lists/counts become filter-keyed.

### 4. Direct mutation update sites outside the helper layer

- `client/src/features/viewing/components/ModifyButtons.tsx`
  - unarchive cache update currently evicts only
  - any refetch-based or filter-aware redesign has to revisit this path.

- `client/src/pages/CreateRecipe.tsx`
  - uses `updateRecipeCache(cache, record, true)`

- `client/src/pages/CreateVeganRecipe.tsx`
  - uses `updateRecipeCache(cache, record, true)`
  - also manually writes link fragments after create

- `client/src/pages/EditRecipe.tsx`
  - uses `updateRecipeCache(cache, record)`
  - uses `archiveRecipeCache(cache, recipe)`
  - uses `deleteVeganRecipeCache(cache, recipe)`

- `client/src/features/viewing/components/RecipeCardsContainer.tsx`
  - archive mutation `update(cache, ...)` path uses `archiveRecipeCache(cache, archivedRecipe)`

### 5. GraphQL operations and cache-shape dependencies

- `client/src/graphql/queries/recipe.ts`
  - `GET_RECIPES`
  - `recipeCount(filter: $countFilter)` is part of the public shape

- `client/src/graphql/queries/__mocks__/recipe.ts`
  - all mocked `GET_RECIPES` variants with `recipeCount`
  - archived mocks
  - vegan-filter mocks

- `client/src/graphql/mutations/__mocks__/recipe.ts`
  - archive and unarchive mocks
  - create-vegan mocks that navigate back to home and rely on list/count behavior

### 6. Existing client tests that would likely need updates

#### Cache-helper tests

- `client/src/__tests__/editing.update.test.ts`
  - archive/delete/create cache helper behavior
  - best place for unit-style cache assertions

#### Vegan flow tests

- `client/src/__tests__/index.vegan.test.tsx`
  - create-vegan navigation back to home
  - vegan-filter behavior
  - count/list interactions are already indirectly asserted here

#### Archive/unarchive flow tests

- `client/src/__tests__/index.archive.recipe.test.tsx`
  - archived-view toggle
  - unarchive behavior
  - reset-search behavior while archived view is active

#### Any helper/render utilities that instantiate the cache

- `client/src/utils/tests.tsx`
  - uses `getCache()`

- `client/src/utils/browserTests.tsx`
  - uses `getCache()`

- `client/src/index.tsx`
  - app runtime cache wiring via `getCache()`

## Likely Modification Sets By Option

### If choosing Option A: no cache redesign

Likely touch list:

- none required for cache model
- possibly only docs/handoff closure

### If choosing Option B: full filter-keyed redesign

Minimum likely touch list:

- `client/src/utils/cache.ts`
- `client/src/features/viewing/components/RecipeCardsContainer.tsx`
- `client/src/features/search/hooks/useSearch.tsx`
- `client/src/features/search/utils/filter.ts` (review at minimum)
- `client/src/features/editing/utils/update.ts`
- `client/src/features/viewing/components/ModifyButtons.tsx`
- `client/src/pages/CreateRecipe.tsx`
- `client/src/pages/CreateVeganRecipe.tsx`
- `client/src/pages/EditRecipe.tsx`
- `client/src/graphql/queries/recipe.ts` (review at minimum)
- `client/src/graphql/queries/__mocks__/recipe.ts`
- `client/src/graphql/mutations/__mocks__/recipe.ts`
- `client/src/__tests__/editing.update.test.ts`
- `client/src/__tests__/index.vegan.test.tsx`
- `client/src/__tests__/index.archive.recipe.test.tsx`
- possibly `client/src/utils/tests.tsx`, `client/src/utils/browserTests.tsx`, and `client/src/index.tsx` if any cache setup assumptions change

### If choosing Option C: refetch-driven filtered-view behavior

Minimum likely touch list:

- `client/src/features/editing/utils/update.ts`
- `client/src/features/viewing/components/ModifyButtons.tsx`
- `client/src/features/viewing/components/RecipeCardsContainer.tsx`
- `client/src/pages/EditRecipe.tsx`
- `client/src/pages/CreateRecipe.tsx`
- `client/src/pages/CreateVeganRecipe.tsx`
- `client/src/__tests__/editing.update.test.ts`
- `client/src/__tests__/index.vegan.test.tsx`
- `client/src/__tests__/index.archive.recipe.test.tsx`
- possibly `client/src/utils/cache.ts` only if some partial policy cleanup is still desired

## Suggested Starting Investigation

Before choosing an implementation option, answer these questions explicitly:

1. Should filtered/archived list state be represented by cache keying, or by imperative overwrites into a shared list?
2. Do we want `RecipeCardsContainer` to remain a fixed home-page query consumer, or should it read active query state from search?
3. Are we willing to refetch after archive/unarchive/delete/create operations instead of preserving everything through manual `cache.modify`?
4. Is pagination expected to work independently inside filtered and archived views, or only for the home view?

The answers to those questions determine whether Option B or Option C is the better path.

## Current Safe State

The partial `recipeCount`-by-filter change has been reverted from the worktree. The remaining valid fix in progress is only:

- `CreateVeganRecipe` subsection seeding regression

The cache redesign remains intentionally unimplemented.
