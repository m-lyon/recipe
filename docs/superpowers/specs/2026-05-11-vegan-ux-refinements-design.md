# Vegan UX Refinements — Design Spec

Date: 2026-05-11
Branch: feature/77-make-it-vegan

## Overview

Five targeted UX refinements to the vegan recipe feature. Vegan copies are secondary recipes that should only be discoverable through their originals, not surfaced as independent items.

## 1. Hide Vegan Copies from Main Page

**Goal:** Vegan copies must not appear in the recipe list on the home page (or any search results).

**Approach:** Modify `getSearchFilter` in `client/src/features/search/utils/filter.ts` to always append `{ originalRecipe: null }` to the AND filters. This tells the API to only return recipes where `originalRecipe` is null (i.e., not a vegan copy). Because documents without the field and documents with `originalRecipe: null` both match MongoDB's `null` equality check, this correctly excludes all vegan copies.

No API change needed — `FilterFindManyRecipeInput` already accepts `originalRecipe` as a filter field.

**Also applies to:** The `reset` and `resetToHome` callbacks in `useSearch.tsx` construct filters directly (not via `getSearchFilter`) and must also be updated to include `{ originalRecipe: null }`.

## 2. Apollo Cache: "Vegan Option Available" Tag After Linking

**Problem:** After `recipeLinkVeganVersion` succeeds in `CreateVeganRecipe.tsx`, the original recipe's Apollo cache entry is stale — it doesn't know its `calculatedTags` now includes `'veganOptionAvailable'` or that `veganVersion` is now set.

**Fix:** After a successful `linkVeganRecipe` call, write directly to the Apollo cache to update the original recipe's cached fragment. Specifically:
- Set `calculatedTags` to include `'veganOptionAvailable'`
- Set `veganVersion` to `{ _id: recipeResult._id, title: recipeResult.title, titleIdentifier: recipeResult.titleIdentifier }`

Use `cache.writeFragment` with `RECIPE_FIELDS_SUBSET` targeting the original recipe by its ID (available as `originalId` in `handleSubmitMutation`). The `linkVeganRecipe` mutation needs an `update` callback added to it (like `createRecipe` already has).

**Test:** Add an integration test in `client/src/__tests__/index.vegan.test.tsx` that:
1. Renders the home page with a mock that has the original recipe visible
2. Navigates to create-vegan-recipe flow and completes it
3. Asserts the original recipe card now shows the "vegan option available" tag — **without** a page reload or refetch

This test requires a mock for `LINK_VEGAN_RECIPE` that returns success, and a `GET_RECIPE` mock for the original that initially lacks `veganOptionAvailable` in `calculatedTags`.

## 3. Checkbox: "Edit Vegan Version" When `veganVersion` Exists

**Goal:** On `/edit/recipe/:id`, the checkbox at the bottom of the instructions tab should:
- Show "Create vegan version" (unchecked) when no `veganVersion` exists — existing behaviour
- Show "Edit vegan version" (pre-checked, toggleable) when `veganVersion` exists — new behaviour

**Changes:**
- `EditableRecipe.tsx`: change `showVeganCheckbox={!originalRecipe && !veganVersion}` to `showVeganCheckbox={!originalRecipe}`. Pass `veganVersion` as a new prop to `EditableInstructionsTab`.
- `EditableInstructionsTab.tsx`: accept `veganVersion` prop and pass it to `CreateVeganVersionCheckbox`.
- `CreateVeganVersionCheckbox.tsx`: accept `veganVersion` prop. When `veganVersion` is set, render label as "Edit vegan version" and initialise the store's `createVeganVersion` to `true` (via a `useEffect` on mount). The checkbox remains toggleable.
- `EditRecipe.tsx` initialise: the existing redirect logic at lines 224–232 already handles the case where `createVeganVersion` is true and `veganVersion` exists — it redirects to the vegan copy's edit page. No change needed there.

The Zustand store's `createVeganVersion` state drives the save behaviour; this change just pre-populates it when a `veganVersion` is present.

## 4. Remove "(Vegan)" from Viewed Title

**Goal:** Vegan copies should display their plain title, not `"<title> (Vegan)"`.

**Change:** `client/src/pages/ViewRecipe.tsx` — remove the `isVeganCopy` / `displayTitle` logic. Use `titleNormed` directly for the displayed title. The `isVeganCopy` variable can be removed entirely if unused after this change.

The "Back to original" link (`originalRecipe` block) stays — that's the only navigation path back to the original.

## 5. Remove "View Vegan Version" Button from ModifyButtons

**Goal:** Vegan copies are accessed via the edit flow ("Edit vegan version" checkbox), not a direct view button.

**Change:** `client/src/features/viewing/components/ModifyButtons.tsx` — remove the `recipe.veganVersion` block (currently lines 85–99). The `veganVersion` prop can be removed from the component's props interface if it is no longer used.

## Testing

- **Unit/integration tests** exist for `CreateVeganVersionCheckbox` behaviour and `EditRecipe` save flow; update these to cover the new "Edit vegan version" pre-checked state.
- **New integration test** for cache update (item 2 above).
- **Main page filter test**: update or add a test in `index.*.test.tsx` that asserts vegan copies are not shown on the home page.
- The `ViewRecipe` "(Vegan)" removal and `ModifyButtons` button removal should be covered by existing snapshot/render tests if any; otherwise add simple render assertions.

## Files Changed

| File | Change |
|------|--------|
| `client/src/features/search/utils/filter.ts` | Add `originalRecipe: null` to all filter paths |
| `client/src/features/search/hooks/useSearch.tsx` | Add `originalRecipe: null` to direct filter objects in `reset`/`resetToHome` |
| `client/src/pages/CreateVeganRecipe.tsx` | Add `update` callback to `linkVeganRecipe` to write original recipe's cache |
| `client/src/__tests__/index.vegan.test.tsx` | New test for cache update after link |
| `client/src/features/editing/components/EditableRecipe.tsx` | Change `showVeganCheckbox` condition; pass `veganVersion` to instructions tab |
| `client/src/features/editing/components/EditableInstructionsTab.tsx` | Accept and pass `veganVersion` prop |
| `client/src/features/editing/components/CreateVeganVersionCheckbox.tsx` | Accept `veganVersion`; initialise checked state; change label |
| `client/src/pages/ViewRecipe.tsx` | Remove `(Vegan)` suffix from title |
| `client/src/features/viewing/components/ModifyButtons.tsx` | Remove "View vegan version" button |
