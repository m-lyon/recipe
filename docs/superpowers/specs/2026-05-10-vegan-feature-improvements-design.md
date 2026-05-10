# Vegan Feature Improvements — Design Spec

**Date:** 2026-05-10  
**Branch:** `feature/77-make-it-vegan`

---

## Overview

Four improvements to the "Make it Vegan" feature implemented in PR #85:

1. Block vegan creation if the recipe is already vegan
2. Allow vegan copies to share the original recipe's title
3. Suppress `ITEM_IN_USE` error toast on `CreateVeganRecipe` when removing copied bespoke items
4. Comprehensive client-side tests for the vegan user journeys

---

## Feature 1 — Block vegan creation if recipe is already vegan

### Problem

If a user checks "Create vegan version" on a recipe that already has `calculatedTags` containing `'vegan'`, the flow proceeds to `/create/recipe/vegan/:titleIdentifier`, which is pointless — the recipe is already vegan.

### Solution

In `EditRecipe.tsx` `handleSubmitMutation`, inside the `if (recipeState.createVeganVersion)` block, add a check **before** the `veganVersion` redirect:

```
if calculatedTags includes 'vegan':
    → reset createVeganVersion
    → show warning toast: "Recipe is already vegan" / "This recipe does not need a vegan version"
    → fall through to normal save flow (success toast + navigate to PATH.ROOT)
else if veganVersion already exists:
    → existing: show "Redirecting" toast + navigate to edit vegan version
else:
    → existing: navigate to /create/recipe/vegan/:titleIdentifier
```

**New hook required:** `useWarningToast` — add `'warning'` to the `ToastType` union in `toastCreator.tsx` and export `useWarningToast = createToastHook('warning')` from `client/src/common/hooks/index.tsx`.

### Files changed
- `client/src/common/hooks/toastCreator.tsx` — add `'warning'` to `ToastType`
- `client/src/common/hooks/index.tsx` — export `useWarningToast`
- `client/src/pages/EditRecipe.tsx` — add already-vegan guard + warning toast

---

## Feature 2 — Title uniqueness exemption for vegan copies

### Problem

`CREATE_RECIPE` runs Mongoose title uniqueness validation (`uniqueInAdminsAndUser`), which checks that no other recipe owned by the same user (or an admin) has the same title. A vegan copy will typically share the original's title and therefore fails this validation.

### Solution

In `api/src/models/validation.ts`, add an early return to `uniqueInAdminsAndUser`'s validator function:

```ts
if (this.originalRecipe != null) {
    return true; // vegan copies may share the original's title
}
```

This fires before any DB queries and is scoped only to the title field (only `Recipe.title` uses `uniqueInAdminsAndUser`). All other uniqueness rules remain intact.

`titleIdentifier` uniqueness is not affected — the `generateRecipeIdentifier` function appends a random 5-char suffix, so each recipe's `titleIdentifier` is already globally unique regardless of title.

### API tests required
- Creating a vegan copy (with `originalRecipe` set) with the same title as the original → succeeds
- Creating a non-linked recipe with a duplicate title → still fails

### Files changed
- `api/src/models/validation.ts` — add `originalRecipe` exemption

---

## Feature 3 — Suppress ITEM_IN_USE error toast on CreateVeganRecipe

### Problem

`CreateVeganRecipe` pre-populates ingredients from the original recipe, including any non-unique (bespoke) units and prepMethods. When the user removes a pre-populated ingredient, `EditableIngredientSubsection` fires `DELETE_UNIT`/`DELETE_PREP_METHOD`. The API's `validateItemNotInRecipe` middleware rejects this because the unit is still referenced by the original recipe, returning `ITEM_IN_USE`. The user sees a confusing error toast even though the remove action is correct.

However, users can also add *new* bespoke units/prepMethods on `CreateVeganRecipe` and then remove them — in that case the delete should proceed normally and the toast should show on genuine errors.

### Solution

Suppress the error toast **only** when `error.graphQLErrors[0]?.extensions?.code === 'ITEM_IN_USE'` and the consuming page opts in via a `suppressItemInUseError` prop.

**Prop threading:** `EditableRecipe` → `EditableIngredientSubsections` → `EditableIngredientSubsection`

- `EditableRecipe` — add `suppressItemInUseError?: boolean` prop; pass to `<EditableIngredientSubsections>`
- `EditableIngredientSubsections` — accept + pass to each `<EditableIngredientSubsection>`
- `EditableIngredientSubsection` — accept; in `onError` for `deleteUnit` and `deletePrepMethod`, skip the `errorToast` call if `suppressItemInUseError && code === 'ITEM_IN_USE'`

`CreateVeganRecipe.tsx` passes `suppressItemInUseError` to `<EditableRecipe>`.  
`EditRecipe.tsx` does not pass it (defaults to `undefined` / falsy).

The mutation still fires — it will fail silently for copied bespoke items that belong to the original recipe, and succeed normally for newly-created bespoke items.

### Files changed
- `client/src/features/editing/components/EditableRecipe.tsx` — add prop, pass through
- `client/src/features/editing/components/EditableIngredientSubsections.tsx` — add prop, pass through
- `client/src/features/editing/components/EditableIngredientSubsection.tsx` — add prop, conditionally suppress toast
- `client/src/pages/CreateVeganRecipe.tsx` — pass `suppressItemInUseError` to `EditableRecipe`

---

## Feature 4 — Client-side tests for the vegan user journeys

### New test file

`client/src/__tests__/index.vegan.test.tsx`

Uses the standard integration test pattern: `MockedProvider` + `@testing-library/react` + `vitest`.

### Mock data additions

In `client/src/graphql/queries/__mocks__/recipe.ts`:
- `mockRecipeWithVeganVersion` — recipe with `veganVersion: { _id, title, titleIdentifier }` and `originalRecipe: null`
- `mockRecipeVeganCopy` — recipe with `originalRecipe: { _id, title, titleIdentifier }` and `veganVersion: null`

In `client/src/__mocks__/graphql.ts`:
- `mockGetRecipeWithVeganVersion` — `GET_RECIPE` mock returning `mockRecipeWithVeganVersion`
- `mockGetRecipeVeganCopy` — `GET_RECIPE` mock returning `mockRecipeVeganCopy`

Note: `mockRecipeOne` already has `calculatedTags: ['vegan', 'vegetarian']`, so it can be reused for the "already vegan" test case.

### Test scenarios

| # | Scenario | What is asserted |
|---|----------|-----------------|
| 1 | Edit page — checkbox visible for normal recipe | Checkbox with label "Create vegan version" is rendered |
| 2 | Edit page — checkbox hidden when recipe has `veganVersion` | Checkbox not rendered |
| 3 | Edit page — checkbox hidden when recipe is a vegan copy (`originalRecipe` set) | Checkbox not rendered |
| 4 | Check checkbox + save → navigates to CreateVeganRecipe | URL becomes `/create/recipe/vegan/:titleIdentifier` |
| 5 | Check checkbox when recipe already has vegan version → toast + navigate to edit vegan | "Redirecting to existing vegan version" toast shown; URL becomes `/edit/recipe/:veganTitleIdentifier` |
| 6 | Check checkbox when recipe is already vegan (calculatedTags) → warning toast + navigate home | Warning toast "Recipe is already vegan" shown; URL becomes `/` |
| 7 | CreateVeganRecipe — page loads and pre-populates title from original | Original recipe title pre-filled |
| 8 | CreateVeganRecipe — successful submit → success toast + navigate to edit | "Vegan version created" toast; URL becomes `/edit/recipe/:newVeganTitleIdentifier` |
| 9 | CreateVeganRecipe — link failure → error toast shown | Error toast for failed `LINK_VEGAN_RECIPE` |
| 10 | CreateVeganRecipe — removing ingredient with copied bespoke unit suppresses ITEM_IN_USE toast | Error toast is NOT shown when `DELETE_UNIT` returns `ITEM_IN_USE` |

### Files changed
- `client/src/graphql/queries/__mocks__/recipe.ts` — add `mockRecipeWithVeganVersion`, `mockRecipeVeganCopy`
- `client/src/__mocks__/graphql.ts` — add mock GET_RECIPE wrappers
- `client/src/__tests__/index.vegan.test.tsx` — new test file (10 test cases)

---

## Summary of all files changed

| File | Change |
|------|--------|
| `api/src/models/validation.ts` | Feature 2: exemption for `originalRecipe != null` |
| `client/src/common/hooks/toastCreator.tsx` | Feature 1: add `'warning'` to `ToastType` |
| `client/src/common/hooks/index.tsx` | Feature 1: export `useWarningToast` |
| `client/src/pages/EditRecipe.tsx` | Feature 1: already-vegan guard + warning toast |
| `client/src/features/editing/components/EditableRecipe.tsx` | Feature 3: `suppressItemInUseError` prop |
| `client/src/features/editing/components/EditableIngredientSubsections.tsx` | Feature 3: prop passthrough |
| `client/src/features/editing/components/EditableIngredientSubsection.tsx` | Feature 3: suppress toast conditionally |
| `client/src/pages/CreateVeganRecipe.tsx` | Feature 3: pass `suppressItemInUseError` |
| `client/src/graphql/queries/__mocks__/recipe.ts` | Feature 4: new mock recipes |
| `client/src/__mocks__/graphql.ts` | Feature 4: new GET_RECIPE mocks |
| `client/src/__tests__/index.vegan.test.tsx` | Feature 4: new test file |
