# Design: Button Order and Vegan Delete Tag Fix

Date: 2026-05-19

## Overview

Two independent changes:

1. **UI change** — move the destructive action button (Archive / Delete vegan version) to the right of the Save button on the edit page.
2. **Bug fix** — after deleting a vegan copy of a recipe, the original recipe still shows the "vegan version available" tag on the home page. Root cause: a string mismatch in the cache update utility.

---

## 1. UI Change: Button Order

### Current behaviour

In `EditableRecipe.tsx`, the `RecipeActionButtons` wrapper renders:

```
[ Archive / Delete vegan version ]  [ Save ]
```

The destructive button is on the left, the save button is on the right.

### Desired behaviour

```
[ Save ]  [ Archive / Delete vegan version ]
```

### Implementation

**File:** `client/src/features/editing/components/EditableRecipe.tsx`

Swap the two children inside `<RecipeActionButtons>` so `<SubmitButton>` comes first and `{secondaryActionButton}` comes second. The wrapper uses a flex `Wrap` so DOM order directly determines left-to-right position.

No changes to styling, prop names, `RecipeActionButtons`, or `EditRecipe`.

Applies to both Archive (on original recipe edit pages) and Delete vegan version (on vegan copy edit pages) since both use the same `secondaryActionButton` slot.

---

## 2. Bug Fix: Vegan Tag Persists After Vegan Copy Deletion

### Root cause

`deleteVeganRecipeCache` in `client/src/features/editing/utils/update.ts` updates the original recipe's `calculatedTags` in the Apollo cache:

```ts
calculatedTags(existing: string[] = []) {
    return existing.filter((tag) => tag !== ReservedTags.VeganVersionAvailable);
}
```

`ReservedTags.VeganVersionAvailable` is `'vegan_version_available'` (client-side generated enum, underscore-separated). However, the API stores and returns the tag as `'vegan version available'` (human-readable, space-separated). These strings never match, so the filter is a no-op and the tag is never removed from the cached original recipe.

### Why the existing test does not catch this

The existing deletion test (`index.vegan.test.tsx`, line ~999) starts by rendering the vegan copy's edit page directly. After the delete, it navigates to `/` and Apollo fires a fresh `GET_RECIPES` request (the cache has no prior home-page data). The test provides a mock `GET_RECIPES` response that already excludes the vegan tag, so the correct state is shown — not because `cache.modify` worked, but because the fresh network response overwrote it. The bug is masked.

### Fix

**File:** `client/src/features/editing/utils/update.ts`

Replace:

```ts
return existing.filter((tag) => tag !== ReservedTags.VeganVersionAvailable);
```

with:

```ts
return existing.filter((tag) => tag !== displayCalculatedTag(ReservedTags.VeganVersionAvailable));
```

`displayCalculatedTag` is the existing utility that maps `'vegan_version_available'` → `'vegan version available'`, matching the string the API actually stores in the cache. No new abstraction is needed.

`displayCalculatedTag` must be imported from `@recipe/features/tags`.

---

## 3. Regression Test

**File:** `client/src/__tests__/index.vegan.test.tsx`

**Test name:** `should clear vegan version tag from original recipe after deleting vegan copy without a fresh GET_RECIPES fetch`

**Location:** inside the existing `describe('EditRecipe — destructive action button', ...)` block.

### Test flow

1. Render the app with `MemoryRouter` starting at `/` so the initial `GET_RECIPES` mock is consumed and its data — including the original recipe with the `'vegan version available'` tag — is cached.
2. Navigate to `/edit/mock-recipe-one-vegan` (the vegan copy's edit page).
3. Click "Delete vegan version", then "Confirm delete vegan version action".
4. The mutation fires. `deleteVeganRecipeCache` runs and `cache.modify` attempts to remove the tag.
5. The test redirects to `/`. No second `GET_RECIPES` mock is provided, so Apollo uses the cached data.
6. Assert: the original recipe card shows **no** `'vegan version available'` tag.

### Why this catches the bug

With the current code, step 4's `cache.modify` is a no-op (string mismatch), the cached `calculatedTags` still contains `'vegan version available'`, step 5 uses the cached data, and step 6 fails. After the fix, `cache.modify` correctly removes the tag, the cached data is clean, and step 6 passes.

### Mocks needed

| Mock | Source |
|---|---|
| Initial `GET_RECIPES` (includes original with vegan tag) | existing `mockGetRecipes` |
| `GET_RECIPE` for the vegan copy edit page | existing `mockGetRecipeVeganCopy` |
| `DELETE_RECIPE` for the vegan copy | existing `mockDeleteRecipeVeganCopy` |
| Second `GET_RECIPES` | **not provided** — this is what makes the test sensitive to the `cache.modify` correctness |

---

## Files Changed

| File | Change |
|---|---|
| `client/src/features/editing/components/EditableRecipe.tsx` | Swap `SubmitButton` and `{secondaryActionButton}` render order |
| `client/src/features/editing/utils/update.ts` | Use `displayCalculatedTag(ReservedTags.VeganVersionAvailable)` in `calculatedTags` filter |
| `client/src/__tests__/index.vegan.test.tsx` | Add regression test starting from home page |

---

## Testing

- `npm test -- run src/__tests__/index.vegan.test.tsx` — new test red before fix, green after
- `npm test -- run src/__tests__/index.vegan.test.tsx` — existing deletion test continues to pass
- `npm run lint` — no new lint errors
