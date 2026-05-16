## Summary

Add linked vegan/original recipe switching via an icon button on the recipe view page, and add a destructive action button on the edit page that archives original recipes or deletes vegan versions. The API will enforce linked archive/unarchive behavior for original recipes and linked cleanup when vegan versions are deleted. The client will update Apollo cache directly so home-page and linked recipe state stay correct without refresh.

## Goals

- Replace `View Vegan Version` and `View Original Recipe` text links on the recipe view page with an icon button placed to the left of the keep-screen-awake button.
- Use `PiPlant` when linking from an original recipe to its vegan version.
- Use `TbMeat` when linking from a vegan version to its original recipe.
- Add a light red destructive action button beside `Save` on the edit recipe page.
- Original recipes must be archived, not deleted.
- Vegan versions must be deletable.
- Archiving or unarchiving an original recipe must also archive or unarchive its vegan version when present.
- Deleting a vegan version must clear the original recipe's `veganVersion` reference.
- Client-side Apollo cache must reflect these changes immediately, especially on the home page.
- After confirming archive or delete, redirect to the home page.

## Non-Goals

- Changing recipe ownership or authorization rules.
- Adding new browse flows for archived vegan versions.
- Adding bulk archive/delete actions.
- Reworking the full edit page layout beyond inserting the new action button beside save.

## Current State

- `client/src/pages/ViewRecipe.tsx` renders text links under the title card when `originalRecipe` or `veganVersion` exists.
- `client/src/features/viewing/components/IngredientList.tsx` already renders the keep-screen-awake icon button in the ingredient header row.
- `client/src/features/editing/components/EditableRecipe.tsx` renders a single fixed `SubmitButton` in the action area.
- `client/src/features/editing/components/ConfirmArchiveModal.tsx` already provides the preferred Mantine-styled confirmation modal pattern.
- `api/src/schema/Recipe.ts` already has `recipeArchiveById`, `recipeUnarchiveById`, and `recipeRemoveById`, but archive/unarchive currently affect only one recipe at a time.
- `recipeRemoveById` already clears `veganVersion` on an original when deleting a vegan copy, but this needs explicit client cache handling and test coverage.

## Design

### 1. View-page linked recipe toggle

Move linked recipe switching from the title area into the ingredient header controls.

- Extend `IngredientList` with an optional linked-recipe action prop containing:
  - destination URL
  - aria label
  - tooltip label
  - icon
- Render this icon button immediately to the left of the wake-lock button when the linked-recipe action exists.
- Keep the existing wake-lock button behavior unchanged.
- Remove the text `Anchor` links from `ViewRecipe.tsx`.
- `ViewRecipe.tsx` will derive a single linked action:
  - if `originalRecipe` exists, use `TbMeat` and route to the original recipe
  - else if `veganVersion` exists, use `PiPlant` and route to the vegan version

This keeps the page visually tighter and makes linked recipe switching feel like a contextual viewing control instead of extra body content.

### 2. Edit-page destructive action

Add a second fixed action button beside `Save` in the edit recipe page action area.

- Extend the existing edit action area so it can render both:
  - primary save button
  - secondary destructive button
- The destructive button appears in a light red treatment.
- Button label is data-driven:
  - original recipe: `Archive`
  - vegan version: `Delete vegan version`
- Clicking the button opens a confirmation modal using the same Mantine styling pattern as `ConfirmArchiveModal`.
- The modal content is action-specific:
  - archive original: explain it can be restored later and that linked vegan version is archived too when present
  - delete vegan version: explain it permanently deletes the vegan copy and removes the link from the original recipe
- Confirming either action redirects to the home page after success.

To avoid duplicating modal styling logic, the preferred implementation is to generalize the existing archive modal into a reusable confirmation modal that accepts title, body, confirm label, confirm color, and confirm callback.

### 3. Server behavior

Keep the existing mutation API surface and make the resolvers enforce the linked behaviors.

#### `recipeArchiveById`

- Load the target recipe.
- If the target recipe has an `originalRecipe`, treat it as a vegan version and archive only that record.
- If the target recipe is an original recipe and has a `veganVersion`, archive both the original and its vegan version.
- Preserve the existing validation that blocks archiving recipes still used as ingredients.

#### `recipeUnarchiveById`

- If the target recipe is an original recipe and has a `veganVersion`, unarchive both records.
- If the target recipe is a vegan version, unarchive only that recipe.

#### `recipeRemoveById`

- Keep the existing image and rating cleanup.
- Keep clearing `veganVersion` on the original when deleting a vegan version.
- Ensure the original recipe is saved or updated in a way that consistently removes the derived `vegan version available` state.
- Do not allow originals to be deleted from the edit page client flow; the destructive action for originals will only call archive.

This keeps relational invariants in the API, where partial client failures cannot split linked recipe state.

### 4. Apollo cache updates

The client must update cache directly so state stays correct without refresh.

#### Archive original recipe

- Remove the original recipe from cached non-archived home-page `recipeMany` lists.
- Decrement cached matching `recipeCount` values where appropriate.
- If the original has a vegan version and the vegan version is cached, mark that cached recipe as archived too.
- Update any cached recipe detail nodes for the archived original and linked vegan version.

#### Delete vegan version

- Evict the vegan recipe node from cache.
- Remove it from any cached lists where it may appear.
- Update the original recipe node so `veganVersion` becomes `null`.
- Ensure any cached calculated tag or linked-recipe UI state derived from `veganVersion` no longer presents vegan-version navigation.

#### Unarchive original recipe

- This work is primarily server-side plus cache consistency.
- If the UI path exposes unarchive actions through existing recipe cards, both original and vegan cached nodes should reflect `archived: false`.

Cache updates should be handled in mutation `update` functions or a small shared recipe-cache helper rather than by relying on refetch.

## UI Behavior

### View page

- Original with vegan version: show plant icon button left of wake-lock button.
- Vegan version with original recipe: show meat icon button left of wake-lock button.
- No linked recipe: show no linked-recipe icon.
- Tooltip and aria text must describe the navigation target clearly.

### Edit page

- Original recipe edit page: show `Archive` beside `Save`.
- Vegan version edit page: show `Delete vegan version` beside `Save`.
- Confirmation modal opens before mutation runs.
- On success, show success feedback and redirect to home.
- On mutation error, show error feedback and remain on the edit page.

## Error Handling

- If archive/delete mutation fails, keep the modal closed after the request, show an error toast, and do not navigate away.
- If linked archive/unarchive server updates fail, return the mutation error and do not partially report success.
- If the original recipe reference is missing when deleting a vegan version, still delete the vegan recipe and treat cache cleanup of the original link as best-effort based on available cached data.

## Testing

### API tests

Add or update GraphQL resolver tests in `api/test/graphql/Recipe.test.ts` for:

- archiving an original recipe archives its vegan version
- unarchiving an original recipe unarchives its vegan version
- deleting a vegan version clears `veganVersion` on the original recipe

### Client tests

Add client tests covering:

- original recipe view page shows `View vegan version` icon button with `PiPlant`
- vegan recipe view page shows `View original recipe` icon button with `TbMeat`
- clicking the linked-recipe icon navigates to the corresponding linked recipe page
- original recipe edit page shows `Archive` button
- vegan version edit page shows `Delete vegan version` button
- confirmation modal appears with correct action-specific content
- confirming archive redirects to home and updates the home-page cache immediately
- confirming vegan delete redirects to home and removes linked vegan-version state from the original recipe without refresh

Tests should continue following the current pattern of explicit Apollo mocks aligned with cache behavior.

## Risks and Mitigations

- Shared mock IDs between vegan copy fixtures and other recipes can corrupt normalized cache state.
  - Use distinct IDs in any new mocks introduced for archive/delete behavior.
- Reused route components can preserve mutation state across param changes.
  - Keep using explicit mutation reset patterns where route-param navigation stays inside the same component.
- Cache logic for hidden vegan copies and home-page counts is already nuanced.
  - Reuse shared helpers where possible and test both list removal and linked node updates.

## Implementation Notes

- Prefer a small shared helper for recipe archive/delete cache mutations instead of duplicating `cache.modify` blocks.
- Keep the client-side destructive behavior branch based on `originalRecipe` presence:
  - `originalRecipe` present means the current record is a vegan version, so delete is allowed
  - otherwise archive the current recipe
- Preserve existing visual patterns and spacing in the fixed action area.
