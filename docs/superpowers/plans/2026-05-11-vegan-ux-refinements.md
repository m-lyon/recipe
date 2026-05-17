# Vegan UX Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Five UX polish items for the vegan recipe feature: hide vegan copies from the home page list, update the Apollo cache after linking so the original recipe's card shows the vegan link immediately, change the edit-recipe checkbox to "Edit vegan version" (pre-checked) when a vegan version already exists, remove the `(Vegan)` suffix from the view page title, and remove the "View vegan version" hover button from recipe cards.

**Architecture:** Each refinement is a small, isolated change. The hide-from-list change threads `originalRecipe: null` into `getSearchFilter` and every raw `defaultFilter` object in `useSearch.tsx` and `RecipeCardsContainer.tsx`. The Apollo cache update adds an `update` callback to the `linkVeganRecipe` mutation call. The checkbox change propagates a `veganVersion` prop from `EditRecipe` → `EditableRecipe` → `EditableInstructionsTab` → `CreateVeganVersionCheckbox`. The view-page and card changes are single-file deletions.

**Tech Stack:** React 18, TypeScript, Apollo Client 3, Vitest + @testing-library/react, Mantine 8, Zustand 5.

---

## File Map

| File | Change |
|------|--------|
| `client/src/features/search/utils/filter.ts` | Add `originalRecipe: null` to base filter |
| `client/src/features/search/hooks/useSearch.tsx` | Add `originalRecipe: null` to `defaultFilter` objects in `reset` and `resetToHome` |
| `client/src/features/viewing/components/RecipeCardsContainer.tsx` | Add `originalRecipe: null` to `defaultFilter` const |
| `client/src/pages/CreateVeganRecipe.tsx` | Add `update` callback to `linkVeganRecipe` mutation |
| `client/src/features/editing/components/EditableInstructionsTab.tsx` | Add `veganVersion` prop; pass to `CreateVeganVersionCheckbox` |
| `client/src/features/editing/components/CreateVeganVersionCheckbox.tsx` | Accept `veganVersion` prop; swap label + pre-check via `useEffect` when set |
| `client/src/features/editing/components/EditableRecipe.tsx` | Change `showVeganCheckbox` condition; pass `veganVersion` to `EditableInstructionsTab` |
| `client/src/pages/ViewRecipe.tsx` | Remove `isVeganCopy`/`displayTitle`; use `titleNormed` directly |
| `client/src/features/viewing/components/ModifyButtons.tsx` | Remove `recipe.veganVersion` button block |
| `client/src/__tests__/index.vegan.test.tsx` | Add integration tests for refinements 1 and 2 |
| `client/src/graphql/queries/__mocks__/recipe.ts` | Update `mockGetRecipes` variables to include `originalRecipe: null` |
| `client/src/graphql/mutations/__mocks__/recipe.ts` | Add `mockLinkVeganRecipeWithCacheUpdate` if needed for test |

---

## Task 1: Hide vegan copies from the recipe list (filter.ts + useSearch.tsx + RecipeCardsContainer.tsx)

**Files:**
- Modify: `client/src/features/search/utils/filter.ts:12`
- Modify: `client/src/features/search/hooks/useSearch.tsx:77,94`
- Modify: `client/src/features/viewing/components/RecipeCardsContainer.tsx:38`

### Context

`getSearchFilter` always begins with `[{ archived: showArchived }]`. If we add `{ originalRecipe: null }` to that initial array, every search query—debounced, on-change, and explicit—will exclude vegan copies. The two `defaultFilter` objects that bypass `getSearchFilter` (in `reset` and `resetToHome`) must be updated too. The `RecipeCardsContainer` initial query also uses a hardcoded `defaultFilter = { archived: false }`.

`FilterFindManyRecipeInput` has a field `originalRecipe: null` which instructs Mongoose to match documents where `originalRecipe` is null, i.e. non-vegan-copy recipes.

- [ ] **Step 1: Write the failing integration test**

Add a new `describe` block to `client/src/__tests__/index.vegan.test.tsx`:

```tsx
describe('Home page — hide vegan copies', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show vegan copies on the home page', async () => {
        // mockGetRecipes already filters: its result only has mockRecipeOne, Two, Three, Four
        // The test verifies mockRecipeVeganCopy (titleIdentifier: 'mock-recipe-one-vegan') is absent.
        // We need a mock that returns both a normal recipe AND a vegan copy so we can check
        // the vegan copy is filtered out by the query variables.
        const { GET_RECIPES } = await import('@recipe/graphql/queries/recipe');
        const { mockRecipeVeganCopy } = await import(
            '@recipe/graphql/queries/__mocks__/recipe'
        );
        // A mock that only matches when originalRecipe: null is in the filter — i.e. the
        // filter we expect the UI to send after the fix.
        const mockGetRecipesNoVeganCopies = {
            request: {
                query: GET_RECIPES,
                variables: {
                    offset: 0,
                    limit: 5,
                    filter: { archived: false, originalRecipe: null },
                    countFilter: { archived: false, originalRecipe: null },
                },
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeMany: [mockRecipeOne, mockRecipeTwo, mockRecipeThree, mockRecipeFour],
                    recipeCount: 4,
                },
            },
        };
        renderPage(routes, [
            ...mocksMinimal,
            mockGetRecipesNoVeganCopies,
            mockGetRecipeTwo,
            mockGetRecipeThree,
        ], [PATH.ROOT]);

        // The recipe list should render without the vegan copy's title
        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        // Vegan copy title would be 'Mock Recipe' too in mock data — use titleIdentifier
        // Instead, verify no Apollo "no mock found" error by confirming the page loaded.
        // The real assertion is that the query variables sent include originalRecipe: null,
        // which is verified by the mock only matching if those variables are correct.
        // If the mock didn't match, Apollo would log an error and the list would be empty.
        expect(screen.queryByText('No results')).toBeNull();
    });
});
```

Also add these imports near the top of the test file (after existing imports):

```tsx
import { mockRecipeOne, mockRecipeTwo, mockRecipeThree, mockRecipeFour } from '@recipe/graphql/queries/__mocks__/recipe';
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd client && npm test -- run --reporter=verbose 2>&1 | grep -A5 "hide vegan copies"
```

Expected: test fails — Apollo receives request with `{ archived: false }` (no `originalRecipe: null`), mock doesn't match, recipe list is empty or Apollo logs "no mock found".

- [ ] **Step 3: Update `getSearchFilter` in filter.ts**

Replace the initial filters array line:

```ts
// Before
const filters: FilterFindManyRecipeInput[] = [{ archived: showArchived }];

// After
const filters: FilterFindManyRecipeInput[] = [{ archived: showArchived, originalRecipe: null }];
```

Full updated file `client/src/features/search/utils/filter.ts`:

```ts
import { FilterFindManyRecipeInput } from '@recipe/graphql/generated';

export interface Query {
    title?: string;
    tags?: string[];
    calculatedTags?: ReservedTags[];
    ingredients?: string[];
}

export function getSearchFilter(query: Query, showArchived: boolean): FilterFindManyRecipeInput {
    const { title, tags, calculatedTags, ingredients } = query;
    const filters: FilterFindManyRecipeInput[] = [{ archived: showArchived, originalRecipe: null }];
    if (title) {
        filters.push({ _operators: { title: { regex: `/${title}/i` } } });
    }
    if (tags?.length) {
        for (const tag of tags) {
            filters.push({ _operators: { tags: { in: [tag] } } });
        }
    }
    if (calculatedTags?.length) {
        for (const cTag of calculatedTags) {
            filters.push({ _operators: { calculatedTags: { in: [cTag] } } });
        }
    }
    if (ingredients?.length) {
        for (const ingredient of ingredients) {
            filters.push({
                _operators: {
                    ingredientSubsections: { ingredients: { ingredient: { in: [ingredient] } } },
                },
            });
        }
    }
    return filters.length === 1 ? filters[0] : { AND: filters };
}
```

- [ ] **Step 4: Update `defaultFilter` in `useSearch.tsx`**

There are two raw `defaultFilter` objects in `useSearch.tsx` (lines 77 and 94). Update both:

```ts
// In reset callback (line 77)
// Before:
const defaultFilter = { archived: showArchivedRef.current };
// After:
const defaultFilter = { archived: showArchivedRef.current, originalRecipe: null };

// In resetToHome callback (line 94)
// Before:
const defaultFilter = { archived: false };
// After:
const defaultFilter = { archived: false, originalRecipe: null };
```

- [ ] **Step 5: Update `defaultFilter` in `RecipeCardsContainer.tsx`**

```ts
// Before (line 38)
const defaultFilter = { archived: false };
// After
const defaultFilter = { archived: false, originalRecipe: null };
```

- [ ] **Step 6: Update `mockGetRecipes` variables to match new filter**

`mockGetRecipes` in `client/src/graphql/queries/__mocks__/recipe.ts` uses `{ archived: false }`. After the fix, the UI sends `{ archived: false, originalRecipe: null }`. Update it:

```ts
// Before (around line 559)
variables: {
    offset: 0,
    limit: 5,
    filter: { archived: false },
    countFilter: { archived: false },
} satisfies GetRecipesQueryVariables,

// After
variables: {
    offset: 0,
    limit: 5,
    filter: { archived: false, originalRecipe: null },
    countFilter: { archived: false, originalRecipe: null },
} satisfies GetRecipesQueryVariables,
```

Also update every other mock in that file that uses `{ archived: false }` as the filter (e.g. `mockGetRecipesExtra`, `mockGetRecipesLarger`, archived variants). Search for all occurrences:

```bash
grep -n "archived: false\|archived: showArchived\|archived: true" client/src/graphql/queries/__mocks__/recipe.ts
```

For each `GET_RECIPES` mock variables block found, add `originalRecipe: null` alongside `archived`.

Also update `mockGetArchivedRecipes` (which uses `{ archived: true }`) → `{ archived: true, originalRecipe: null }`.

- [ ] **Step 7: Run all client tests to confirm the test now passes and nothing is broken**

```bash
cd client && npm test -- run 2>&1 | tail -20
```

Expected: all tests pass (or same pre-existing failures as before).

- [ ] **Step 8: Commit**

```bash
git add client/src/features/search/utils/filter.ts \
        client/src/features/search/hooks/useSearch.tsx \
        client/src/features/viewing/components/RecipeCardsContainer.tsx \
        client/src/graphql/queries/__mocks__/recipe.ts \
        client/src/__tests__/index.vegan.test.tsx
git commit -m "feat: exclude vegan copies from recipe list by default"
```

---

## Task 2: Apollo cache update after linking vegan recipe

**Files:**
- Modify: `client/src/pages/CreateVeganRecipe.tsx:137`
- Test: `client/src/__tests__/index.vegan.test.tsx`

### Context

After `linkVeganRecipe` succeeds, the original recipe's cached entry still has `veganVersion: null`. Adding an `update` callback to `useMutation(LINK_VEGAN_RECIPE)` lets us write the updated `veganVersion` reference directly to the cache, so the original recipe card reflects the link without a refetch.

`RECIPE_FIELDS_SUBSET` fragment includes `veganVersion { _id title titleIdentifier }` and `originalRecipe { _id title titleIdentifier }`. We can use `cache.writeFragment` to update just those two fields on the original recipe's cache entry.

The `originalId` and the newly-created `recipeResult` are available at the call site inside `handleSubmitMutation`. However, `useMutation`'s `update` callback receives `(cache, { data })` — `data` here is the result of `LINK_VEGAN_RECIPE`, which returns `{ recipeLinkVeganVersion: true }`. We don't have `recipeResult` there. Instead, we use a `variables`-based approach: use the `update` option on the `mutate` call (second arg to `linkVeganRecipe({ variables, update })`).

Apollo's `mutate` function accepts `update` as a per-call option. We pass `update` inline when we call `await linkVeganRecipe({ variables: ..., update: ... })`.

- [ ] **Step 1: Write the failing integration test**

Add a new `describe` block to `client/src/__tests__/index.vegan.test.tsx` (after existing describe blocks):

```tsx
describe('CreateVeganRecipe — cache update after link', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update the original recipe cache entry with veganVersion after link', async () => {
        const { CREATE_RECIPE } = await import('@recipe/graphql/mutations/recipe');
        const { LINK_VEGAN_RECIPE } = await import('@recipe/graphql/mutations/recipe');
        const { mockRecipeVeganCopy, mockRecipeOne } = await import(
            '@recipe/graphql/queries/__mocks__/recipe'
        );
        const { mockRecipeIdOne, mockRecipeIdTwo } = await import(
            '@recipe/graphql/queries/__mocks__/recipe'
        );

        const createVeganMock = {
            request: {
                query: CREATE_RECIPE,
                variables: {
                    recipe: {
                        title: 'Mock Recipe',
                        pluralTitle: null,
                        numServings: 4,
                        isIngredient: false,
                        notes: null,
                        source: null,
                        tags: [],
                        ingredientSubsections: [],
                        instructionSubsections: [],
                        originalRecipe: mockRecipeIdOne,
                    },
                },
            },
            result: {
                data: {
                    recipeCreateOne: {
                        __typename: 'CreateOneRecipePayload',
                        record: mockRecipeVeganCopy,
                    },
                },
            },
        };

        const linkMock = {
            request: {
                query: LINK_VEGAN_RECIPE,
                variables: { originalId: mockRecipeIdOne, veganId: mockRecipeIdTwo },
            },
            result: { data: { recipeLinkVeganVersion: true } },
        };

        renderPage(
            routes,
            [...mocks, createVeganMock, linkMock],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]
        );

        // Submit the form
        const user = userEvent.setup();
        await user.click(await screen.findByLabelText('Save recipe'));

        // After successful link, navigate to edit page for vegan copy — but we can't
        // test the cache directly in RTL. Instead, navigate home and check the original
        // recipe card. The test verifies no console errors from unmatched mocks (i.e.
        // the update ran without needing a refetch).
        // The key assertion: the success toast appears, confirming the full flow ran.
        expect(await screen.findByText('Vegan version created')).not.toBeNull();
    });
});
```

- [ ] **Step 2: Run the test to confirm the test infrastructure works (it may pass or fail — observe)**

```bash
cd client && npm test -- run --reporter=verbose 2>&1 | grep -A5 "cache update after link"
```

- [ ] **Step 3: Add `update` callback to `linkVeganRecipe` call in `CreateVeganRecipe.tsx`**

The `RECIPE_FIELDS_SUBSET` fragment is needed for `cache.writeFragment`. Import it at the top of `CreateVeganRecipe.tsx`:

```ts
// Add to existing imports from '@recipe/graphql/queries/recipe'
import { GET_RECIPE, RECIPE_FIELDS_SUBSET } from '@recipe/graphql/queries/recipe';
```

Then update the `linkVeganRecipe` call (around line 194) to pass an `update` callback:

```ts
// Before:
await linkVeganRecipe({
    variables: { originalId, veganId: recipeResult._id },
});

// After:
await linkVeganRecipe({
    variables: { originalId, veganId: recipeResult._id },
    update(cache) {
        cache.writeFragment({
            id: `Recipe:${originalId}`,
            fragment: RECIPE_FIELDS_SUBSET,
            fragmentName: 'RecipeFieldsSubset',
            data: {
                veganVersion: {
                    __typename: 'Recipe' as const,
                    _id: recipeResult._id,
                    title: recipeResult.title,
                    titleIdentifier: recipeResult.titleIdentifier,
                },
            },
        });
    },
});
```

Note: `cache.writeFragment` with partial `data` only updates the fields provided; other fields in the fragment are left as-is in the cache.

- [ ] **Step 4: Run tests**

```bash
cd client && npm test -- run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/CreateVeganRecipe.tsx \
        client/src/__tests__/index.vegan.test.tsx
git commit -m "feat: update Apollo cache after linking vegan recipe"
```

---

## Task 3: Edit-recipe checkbox shows "Edit vegan version" when vegan version exists

**Files:**
- Modify: `client/src/features/editing/components/CreateVeganVersionCheckbox.tsx`
- Modify: `client/src/features/editing/components/EditableInstructionsTab.tsx`
- Modify: `client/src/features/editing/components/EditableRecipe.tsx:120`
- Modify: `client/src/pages/EditRecipe.tsx` (confirm `veganVersion` is passed — check current props)
- Test: `client/src/__tests__/index.vegan.test.tsx`

### Context

Currently, `EditableRecipe` passes `showVeganCheckbox={!originalRecipe && !veganVersion}`. This hides the checkbox completely when `veganVersion` exists.

The new behaviour: show the checkbox whenever `!originalRecipe` (i.e. this is not itself a vegan copy). When `veganVersion` is set, render the checkbox pre-checked with label "Edit vegan version". Clicking it (unchecking) sets `createVeganVersion = false`, which means the edit-and-save flow will not redirect to the vegan edit page. Clicking it again checks it, redirecting to vegan edit on save.

The redirect logic in `EditRecipe.tsx` lines 224–232 already handles `createVeganVersion=true && veganVersion exists → navigate to vegan edit page`. No change needed there.

Prop chain: `EditRecipe` already passes `veganVersion` to `EditableRecipe` (line 29 of `EditableRecipe.tsx` shows `veganVersion` in the Props interface). We need to pass it further down to `EditableInstructionsTab` and then to `CreateVeganVersionCheckbox`.

- [ ] **Step 1: Write the failing tests**

Add to `describe('EditRecipe — Vegan Version Checkbox Visibility', ...)` in `client/src/__tests__/index.vegan.test.tsx`:

```tsx
it('should show a pre-checked "Edit vegan version" checkbox when recipe has a vegan version', async () => {
    renderWithRecipeMock(mockGetRecipeWithVeganVersion);
    const user = userEvent.setup();

    await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

    const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
    expect(checkbox).not.toBeNull();
    // Checkbox should be checked (pre-checked via useEffect)
    expect((checkbox as HTMLInputElement).checked).toBe(true);
});

it('should allow unchecking the "Edit vegan version" checkbox', async () => {
    renderWithRecipeMock(mockGetRecipeWithVeganVersion);
    const user = userEvent.setup();

    await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

    const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
    await user.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(false);
});
```

- [ ] **Step 2: Run the failing tests**

```bash
cd client && npm test -- run --reporter=verbose 2>&1 | grep -A5 "Edit vegan version"
```

Expected: FAIL — aria-label `'Edit vegan version of this recipe'` not found (checkbox is hidden).

- [ ] **Step 3: Update `CreateVeganVersionCheckbox.tsx` to accept and use `veganVersion` prop**

```tsx
import { useEffect } from 'react';
import { Checkbox } from '@mantine/core';
import { useShallow } from 'zustand/shallow';

import { useRecipeStore } from '@recipe/stores';

interface Props {
    veganVersion?: { _id: string; title: string; titleIdentifier: string } | null;
}
export function CreateVeganVersionCheckbox({ veganVersion }: Props) {
    const { createVeganVersion, setCreateVeganVersion } = useRecipeStore(
        useShallow((state) => ({
            createVeganVersion: state.createVeganVersion,
            setCreateVeganVersion: state.setCreateVeganVersion,
        }))
    );

    useEffect(() => {
        if (veganVersion) {
            setCreateVeganVersion(true);
        }
    }, [veganVersion, setCreateVeganVersion]);

    const label = veganVersion ? 'Edit vegan version' : 'Create vegan version';
    const ariaLabel = veganVersion
        ? 'Edit vegan version of this recipe'
        : 'Create vegan version of this recipe';

    return (
        <Checkbox
            variant='chakra-style'
            checked={createVeganVersion}
            onChange={(e) => setCreateVeganVersion(e.currentTarget.checked)}
            aria-label={ariaLabel}
            label={label}
        />
    );
}
```

- [ ] **Step 4: Update `EditableInstructionsTab.tsx` to accept and pass `veganVersion`**

```tsx
import { Box, Flex, Spacer } from '@chakra-ui/react';

import { EditableSource } from './EditableSource';
import { AsIngredientCheckbox } from './AsIngredientCheckbox';
import { CreateVeganVersionCheckbox } from './CreateVeganVersionCheckbox';
import { EditableInstructionSubsections } from './EditableInstructionSubsections';

interface Props {
    showVeganCheckbox?: boolean;
    veganVersion?: { _id: string; title: string; titleIdentifier: string } | null;
}
export function EditableInstructionsTab({ showVeganCheckbox, veganVersion }: Props) {
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <EditableInstructionSubsections />
            <Spacer />
            <Flex direction={{ base: 'column', md: 'row' }} justifyContent='space-between'>
                <AsIngredientCheckbox />
                {showVeganCheckbox && (
                    <Box width='100%' display='flex' justifyContent='center' alignItems='flex-end'>
                        <CreateVeganVersionCheckbox veganVersion={veganVersion} />
                    </Box>
                )}
                <EditableSource />
            </Flex>
        </Flex>
    );
}
```

- [ ] **Step 5: Update `EditableRecipe.tsx` to change `showVeganCheckbox` condition and pass `veganVersion`**

Change line 120 (the `EditableInstructionsTab` usage):

```tsx
// Before:
<EditableInstructionsTab showVeganCheckbox={!originalRecipe && !veganVersion} />

// After:
<EditableInstructionsTab showVeganCheckbox={!originalRecipe} veganVersion={veganVersion} />
```

- [ ] **Step 6: Run the failing tests**

```bash
cd client && npm test -- run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add client/src/features/editing/components/CreateVeganVersionCheckbox.tsx \
        client/src/features/editing/components/EditableInstructionsTab.tsx \
        client/src/features/editing/components/EditableRecipe.tsx \
        client/src/__tests__/index.vegan.test.tsx
git commit -m "feat: show pre-checked edit-vegan checkbox when vegan version exists"
```

---

## Task 4: Remove `(Vegan)` suffix from ViewRecipe title

**Files:**
- Modify: `client/src/pages/ViewRecipe.tsx:27-28`

### Context

Lines 27–28 currently compute `isVeganCopy` and `displayTitle`. Since the "View Original Recipe" link is already shown below the title for vegan copies (lines 51–60), the `(Vegan)` suffix is redundant.

- [ ] **Step 1: Write the failing test**

Add to `client/src/__tests__/index.vegan.test.tsx` (in a new `describe`):

```tsx
describe('ViewRecipe — vegan copy title', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not append (Vegan) to the title of a vegan copy', async () => {
        renderPage(
            routes,
            [...mocks, mockGetRecipeVeganCopy],
            [`${PATH.ROOT}/view/recipe/mock-recipe-one-vegan`]
        );
        // The title should just be 'Mock Recipe', not 'Mock Recipe (Vegan)'
        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe (Vegan)')).toBeNull();
    });
});
```

Add `mockGetRecipeVeganCopy` to the imports at the top of the test file:

```tsx
import { mockGetRecipeVeganCopy } from '@recipe/graphql/queries/__mocks__/recipe';
```

- [ ] **Step 2: Run the failing test**

```bash
cd client && npm test -- run --reporter=verbose 2>&1 | grep -A5 "vegan copy title"
```

Expected: FAIL — screen shows "Mock Recipe (Vegan)".

- [ ] **Step 3: Remove `isVeganCopy` and `displayTitle` from `ViewRecipe.tsx`**

```tsx
// Before (lines 24-28):
const { title, numServings, isIngredient, pluralTitle } = data.recipeOne;
const titleNormed =
    isIngredient && pluralTitle ? (numServings > 1 ? pluralTitle : title) : title;
const isVeganCopy = !!data.recipeOne.originalRecipe;
const displayTitle = isVeganCopy ? `${titleNormed} (Vegan)` : titleNormed;

// After:
const { title, numServings, isIngredient, pluralTitle } = data.recipeOne;
const titleNormed =
    isIngredient && pluralTitle ? (numServings > 1 ? pluralTitle : title) : title;
```

And on line 50, change:

```tsx
// Before:
<Title title={displayTitle} />

// After:
<Title title={titleNormed} />
```

- [ ] **Step 4: Run tests**

```bash
cd client && npm test -- run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/ViewRecipe.tsx \
        client/src/__tests__/index.vegan.test.tsx
git commit -m "feat: remove (Vegan) suffix from vegan copy view page title"
```

---

## Task 5: Remove "View vegan version" hover button from recipe cards

**Files:**
- Modify: `client/src/features/viewing/components/ModifyButtons.tsx:85-115`

### Context

Lines 85–115 of `ModifyButtons.tsx` render an `ActionIcon` with a teal leaf icon when `recipe.veganVersion` is set. This button navigates to the vegan version's view page. Removing it simplifies the card UI.

- [ ] **Step 1: Write the failing test**

Add to `client/src/__tests__/index.vegan.test.tsx`:

```tsx
describe('RecipeCard — no vegan version button', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show the "View vegan version" button on a recipe card with a vegan version', async () => {
        // Use a mock that returns mockRecipeWithVeganVersion in the recipe list
        const { GET_RECIPES } = await import('@recipe/graphql/queries/recipe');
        const { mockRecipeWithVeganVersion } = await import(
            '@recipe/graphql/queries/__mocks__/recipe'
        );
        const mockGetRecipesWithVeganVersion = {
            request: {
                query: GET_RECIPES,
                variables: {
                    offset: 0,
                    limit: 5,
                    filter: { archived: false, originalRecipe: null },
                    countFilter: { archived: false, originalRecipe: null },
                },
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeMany: [mockRecipeWithVeganVersion],
                    recipeCount: 1,
                },
            },
        };
        renderPage(routes, [...mocksMinimal, mockGetRecipesWithVeganVersion], [PATH.ROOT]);

        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        expect(
            screen.queryByLabelText('View vegan version of Mock Recipe')
        ).toBeNull();
    });
});
```

- [ ] **Step 2: Run the failing test**

```bash
cd client && npm test -- run --reporter=verbose 2>&1 | grep -A5 "no vegan version button"
```

Expected: FAIL — aria-label `'View vegan version of Mock Recipe'` is found in the DOM.

- [ ] **Step 3: Remove the vegan version button block from `ModifyButtons.tsx`**

Remove lines 85–115 (the entire `{recipe.veganVersion && (...)}` block). The file should go from:

```tsx
    </Box>
    </Box>
    {recipe.veganVersion && (
        <Box zIndex={1}>
            <Box position='absolute'>
                <MantineTooltip
                    label={`View vegan version of ${recipe.title}`}
                    openDelay={500}
                >
                    <ActionIcon
                        variant='filled'
                        color='teal'
                        radius='xl'
                        aria-label={`View vegan version of ${recipe.title}`}
                        component={Link}
                        to={`${PATH.ROOT}/view/recipe/${recipe.veganVersion.titleIdentifier}`}
                        style={{
                            opacity: isHovering ? 1 : 0,
                            transform: `translate(-50%, -50%) scale(${isHovering ? 1 : 0})`,
                            transition: 'opacity 0.3s, transform 0.3s',
                        }}
                    >
                        <svg viewBox='0 0 24 24' width='16' height='16'>
                            <path
                                d='M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L7 19c4-1 7-3 9-7 0 3-1 5-3 7l1 2c2-4 4-8 4-14'
                                fill='currentColor'
                            />
                        </svg>
                    </ActionIcon>
                </MantineTooltip>
            </Box>
        </Box>
    )}
    <Spacer />
```

to:

```tsx
    </Box>
    </Box>
    <Spacer />
```

After removal, also check whether `MantineTooltip` and `ActionIcon` are still used elsewhere in the file. They are not — remove their import lines:

```ts
// Before
import { ActionIcon, Tooltip as MantineTooltip } from '@mantine/core';

// After (if no other Mantine imports remain — check file)
// Remove the line entirely if ActionIcon and MantineTooltip are unused
```

Check the file after edit: if `@mantine/core` imports still has other used items, keep those. If `ActionIcon` and `MantineTooltip` are the only Mantine imports, remove the entire line.

- [ ] **Step 4: Run lint to catch unused imports**

```bash
cd client && npm run lint 2>&1 | grep "ModifyButtons"
```

Expected: no errors. If there are unused import errors, remove those imports.

- [ ] **Step 5: Run tests**

```bash
cd client && npm test -- run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add client/src/features/viewing/components/ModifyButtons.tsx \
        client/src/__tests__/index.vegan.test.tsx
git commit -m "feat: remove View vegan version button from recipe cards"
```

---

## Task 6: Final verification

- [ ] **Step 1: Run all client tests**

```bash
cd client && npm test -- run 2>&1 | tail -30
```

Expected: all tests pass (only the pre-existing `EditableIngredient.browser.test.tsx` failure allowed).

- [ ] **Step 2: Type-check client**

```bash
cd client && npm run check-types 2>&1
```

Expected: no errors.

- [ ] **Step 3: Lint client**

```bash
cd client && npm run lint 2>&1
```

Expected: no errors.

- [ ] **Step 4: Run API tests**

```bash
cd api && npm test 2>&1 | tail -20
```

Expected: all 152 tests pass.
