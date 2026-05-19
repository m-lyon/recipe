# Button Order and Vegan Delete Tag Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the destructive action button to the right of Save on the edit page, and fix a bug where the "vegan version available" tag persists on the original recipe after the vegan copy is deleted.

**Architecture:** Two independent changes. The button swap is a one-line reorder in `EditableRecipe.tsx`. The bug is in `deleteVeganRecipeCache` (`update.ts`): the `calculatedTags` filter compares against the client-side enum value `'vegan_version_available'` but the Apollo cache holds the API-returned string `'vegan version available'`; fixing it requires using `displayCalculatedTag` to produce the correct comparison string. A regression test written first (TDD) starts the app at the home page so `GET_RECIPES` is cached before deletion, ensuring the test exercises `cache.modify` rather than a fresh network response.

**Tech Stack:** React 18, Apollo Client 3, Vitest + @testing-library/react, TypeScript

---

### Task 1: Write the failing regression test

**Files:**
- Modify: `client/src/__tests__/index.vegan.test.tsx`

**Context:** The existing deletion test at line 999 starts on the vegan edit page. When it redirects to `/`, Apollo has no cached home-page data and fires a fresh `GET_RECIPES` — the mock returns tag-free data, masking the bug. The new test starts at the home page instead, caching `GET_RECIPES` before deletion so only `cache.modify` can update the tag.

- [ ] **Step 1: Add the import for `act` to the testing-library import line**

In `client/src/__tests__/index.vegan.test.tsx`, line 3:

```ts
import { act, cleanup, screen, waitFor } from '@testing-library/react';
```

- [ ] **Step 2: Add the import for `mockRecipeFour`**

Line 27 currently reads:
```ts
import { mockRecipeFour, mockRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
```
`mockRecipeFour` is already imported — confirm it's present. If not, add it to that import line.

- [ ] **Step 3: Add the new test inside the `describe('EditRecipe — destructive action button', ...)` block, after the last existing test (line 1028, before the closing `});`)**

```ts
it('should clear the vegan version tag from the original recipe after deleting the vegan copy, relying on cache.modify not a fresh network response', async () => {
    // Start at home so GET_RECIPES is fetched and cached before deletion.
    // This reproduces the real user flow: home → edit vegan copy → delete → home.
    // Without a second GET_RECIPES mock, only cache.modify can update the cached data.
    const mockGetRecipesWithVeganTag = {
        request: mockGetRecipes.request,
        result: {
            data: {
                __typename: 'Query' as const,
                recipeMany: [
                    {
                        ...mockRecipeWithVeganVersion,
                        calculatedTags: ['vegetarian', 'vegan version available'],
                    },
                    mockRecipeTwo,
                    mockRecipeThree,
                    mockRecipeFour,
                ],
                recipeCount: 4,
            },
        },
    };

    const { router } = renderPage(
        routes,
        [
            ...mocksMinimal,
            mockGetRecipesWithVeganTag,
            mockGetRecipeVeganCopy,
            mockGetRecipeTwo,
            mockGetRecipeThree,
            mockDeleteRecipeVeganCopy,
            // No second mockGetRecipes — relying on cache.modify to clear the tag.
        ],
        [PATH.ROOT]
    );
    const user = userEvent.setup();

    // Confirm home loaded and the vegan tag is visible on the original recipe card.
    expect(await screen.findByText('vegan version available')).not.toBeNull();

    // Navigate programmatically to the vegan copy edit page.
    // (The vegan copy does not appear on the home page, so we cannot click through.)
    await act(async () => {
        await router.navigate(`${PATH.ROOT}/edit/recipe/mock-recipe-one-vegan`);
    });

    // Wait for edit page to load.
    await screen.findByRole('button', { name: 'Delete vegan version' });

    // Perform the delete.
    await user.click(screen.getByRole('button', { name: 'Delete vegan version' }));
    await user.click(
        await screen.findByRole('button', { name: 'Confirm delete vegan version action' })
    );

    // Verify redirect to home.
    expect(await screen.findByText('Vegan version deleted')).not.toBeNull();
    expect(await screen.findByText('Recipes')).not.toBeNull();

    // The "vegan version available" tag must be gone — cleared by cache.modify.
    expect(screen.queryByText('vegan version available')).toBeNull();
});
```

- [ ] **Step 4: Run the new test to confirm it is RED**

```bash
cd client && npm test -- run src/__tests__/index.vegan.test.tsx -t "relying on cache.modify not a fresh network response"
```

Expected output: the test **fails**. The failure should be that `screen.queryByText('vegan version available')` is not null (the tag is still present). This confirms the regression is captured.

---

### Task 2: Fix `deleteVeganRecipeCache`

**Files:**
- Modify: `client/src/features/editing/utils/update.ts`

**Context:** Line 125 filters `calculatedTags` using `ReservedTags.VeganVersionAvailable` which is `'vegan_version_available'`. The Apollo cache holds `'vegan version available'` (the API-returned human-readable string). `displayCalculatedTag` from `@recipe/features/tags` already maps `'vegan_version_available'` → `'vegan version available'` and is the correct tool to get the comparison value.

- [ ] **Step 1: Add the `displayCalculatedTag` import at the top of `update.ts`**

After the existing imports (line 6), add:

```ts
import { displayCalculatedTag } from '@recipe/features/tags';
```

- [ ] **Step 2: Fix the filter in `deleteVeganRecipeCache` (line 125)**

Change:

```ts
            calculatedTags(existing: string[] = []) {
                return existing.filter((tag) => tag !== ReservedTags.VeganVersionAvailable);
            },
```

To:

```ts
            calculatedTags(existing: string[] = []) {
                return existing.filter(
                    (tag) => tag !== displayCalculatedTag(ReservedTags.VeganVersionAvailable)
                );
            },
```

- [ ] **Step 3: Run the regression test to confirm it is now GREEN**

```bash
cd client && npm test -- run src/__tests__/index.vegan.test.tsx -t "relying on cache.modify not a fresh network response"
```

Expected: **1 passed**.

- [ ] **Step 4: Run the full vegan test suite to confirm no regressions**

```bash
cd client && npm test -- run src/__tests__/index.vegan.test.tsx
```

Expected: all tests pass (previously 32, now 33).

- [ ] **Step 5: Run lint**

```bash
cd client && npm run lint
```

Expected: no errors.

---

### Task 3: Swap the button order in `EditableRecipe`

**Files:**
- Modify: `client/src/features/editing/components/EditableRecipe.tsx`

**Context:** Lines 141–148 render `{secondaryActionButton}` (Archive / Delete vegan version) before `<SubmitButton>` inside `<RecipeActionButtons>`. `RecipeActionButtons` is a flex `Wrap`, so DOM order determines left-to-right position. Swapping the two children puts Save on the left and the destructive button on the right.

- [ ] **Step 1: Swap the two children inside `<RecipeActionButtons>` (lines 141–148)**

Change:

```tsx
                    <RecipeActionButtons>
                        {secondaryActionButton}
                        <SubmitButton
                            {...submitButtonProps}
                            handleSubmit={handleSubmitMutation}
                            isLoggedIn={isVerified}
                        />
                    </RecipeActionButtons>
```

To:

```tsx
                    <RecipeActionButtons>
                        <SubmitButton
                            {...submitButtonProps}
                            handleSubmit={handleSubmitMutation}
                            isLoggedIn={isVerified}
                        />
                        {secondaryActionButton}
                    </RecipeActionButtons>
```

- [ ] **Step 2: Run the full vegan test suite to confirm no regressions**

```bash
cd client && npm test -- run src/__tests__/index.vegan.test.tsx
```

Expected: all 33 tests pass.

- [ ] **Step 3: Run lint**

```bash
cd client && npm run lint
```

Expected: no errors.

---

### Task 4: Final verification

- [ ] **Step 1: Run the full client test suite**

```bash
cd client && npm test -- run
```

Expected: all tests pass (pre-existing failures in `EditableIngredient.browser.test.tsx` are known and unrelated).

- [ ] **Step 2: Run type check**

```bash
cd client && npm run check-types
```

Note: pre-existing type errors in `client/src/__tests__/editing.update.test.ts` (lines 53, 132, 183) and `client/src/features/editing/utils/update.ts` (around line 57) are known and unrelated to these changes. No new errors should appear.
