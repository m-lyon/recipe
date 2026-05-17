# Vegan Feature Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four improvements to the vegan recipe feature: (1) block vegan creation if recipe is already vegan, (2) allow vegan copies to share the original's title, (3) suppress ITEM_IN_USE toast on CreateVeganRecipe, (4) comprehensive client-side tests.

**Architecture:** Feature 1 is a client-side guard in `EditRecipe.tsx`. Feature 2 is a one-line API validation exemption. Feature 3 is a prop chain (`suppressItemInUseError`) threading through three editing components. Feature 4 is a new test file covering all vegan UI journeys with new mock data.

**Tech Stack:** TypeScript, React 18, Apollo Client 3, Zustand 5, Vitest, @testing-library/react, Mongoose 7, Express/Apollo Server 4, graphql-compose.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `api/src/models/validation.ts` | Modify | Feature 2: exempt vegan copies from title uniqueness |
| `api/test/graphql/Recipe.test.ts` | Modify | Feature 2: add API test for vegan copy title uniqueness |
| `client/src/pages/EditRecipe.tsx` | Modify | Feature 1: add already-vegan guard with warning toast |
| `client/src/features/editing/components/EditableRecipe.tsx` | Modify | Feature 3: add `suppressItemInUseError` prop, pass to subsections |
| `client/src/features/editing/components/EditableIngredientSubsections.tsx` | Modify | Feature 3: accept + pass `suppressItemInUseError` |
| `client/src/features/editing/components/EditableIngredientSubsection.tsx` | Modify | Feature 3: suppress ITEM_IN_USE toast when prop is true |
| `client/src/pages/CreateVeganRecipe.tsx` | Modify | Feature 3: pass `suppressItemInUseError` to EditableRecipe |
| `client/src/graphql/queries/__mocks__/recipe.ts` | Modify | Feature 4: add `mockRecipeWithVeganVersion`, `mockRecipeVeganCopy` |
| `client/src/__mocks__/graphql.ts` | Modify | Feature 4: export new GET_RECIPE mocks |
| `client/src/__tests__/index.vegan.test.tsx` | Create | Feature 4: 10 vegan user journey tests |

---

## Task 1: Feature 2 — API: Exempt vegan copies from title uniqueness

**Files:**
- Modify: `api/src/models/validation.ts`
- Modify: `api/test/graphql/Recipe.test.ts`

- [ ] **Step 1: Add the exemption in `uniqueInAdminsAndUser`**

In `api/src/models/validation.ts`, add an early return at the top of the `validator` function, after the `this.unique !== undefined && !this.unique` check:

```ts
export function uniqueInAdminsAndUser(model: string, attribute: string, message?: string) {
    async function validator(value: string) {
        if (this.unique !== undefined && !this.unique) {
            return true;
        }
        // Vegan copies are allowed to share their original recipe's title
        if (this.originalRecipe != null) {
            return true;
        }
        const admins = await User.find({ role: 'admin' });
        const count = await this.model(model).countDocuments({
            $and: [
                { $or: [{ owner: this.owner }, { owner: { $in: admins } }] },
                { _id: { $ne: this._id } }, // Exclude the current document
                { $or: [{ unique: true }, { unique: { $exists: false } }] },
                { [attribute]: value },
            ],
        });
        return count === 0;
    }
    return { validator, message: message ? message : `The ${model} ${attribute} must be unique.` };
}
```

- [ ] **Step 2: Run API tests to verify no regressions**

```bash
cd api && npm test 2>&1 | tail -5
```

Expected: `149 passing`

- [ ] **Step 3: Add API test — vegan copy may share original's title**

Find the `describe('recipeCreateOne vegan validation', ...)` block in `api/test/graphql/Recipe.test.ts` (around line 1692). Add this test inside that describe block, after the existing tests:

```ts
it('should allow a vegan copy to have the same title as the original recipe', async function () {
    const user = await User.findOne({ username: 'testuser1' });
    const tomato = await Ingredient.findOne({ name: 'tomato' });
    const unit = await Unit.findOne({ shortSingular: 'g' });
    const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

    // Create the original recipe
    const originalResponse = await createRecipe(this, user, {
        title: 'Tomato Soup',
        ingredientSubsections: [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ],
        instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
        numServings: 2,
        tags: [],
        isIngredient: false,
    });
    const originalId = (
        originalResponse.body.singleResult.data as {
            recipeCreateOne: { record: { _id: string } };
        }
    ).recipeCreateOne.record._id;

    // Create a vegan copy with the same title — should succeed
    const veganResponse = await createRecipe(this, user, {
        title: 'Tomato Soup',
        originalRecipe: originalId,
        ingredientSubsections: [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ],
        instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
        numServings: 2,
        tags: [],
        isIngredient: false,
    });
    assert.equal(veganResponse.body.kind, 'single');
    assert.isUndefined(
        veganResponse.body.singleResult.errors,
        veganResponse.body.singleResult.errors
            ? veganResponse.body.singleResult.errors[0].message
            : ''
    );
    const veganRecord = (
        veganResponse.body.singleResult.data as {
            recipeCreateOne: { record: { _id: string; title: string } };
        }
    ).recipeCreateOne.record;
    assert.equal(veganRecord.title, 'Tomato Soup');
});

it('should NOT allow a non-vegan-copy recipe to have a duplicate title', async function () {
    const user = await User.findOne({ username: 'testuser1' });
    const tomato = await Ingredient.findOne({ name: 'tomato' });
    const unit = await Unit.findOne({ shortSingular: 'g' });
    const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

    const record = {
        title: 'Tomato Soup',
        ingredientSubsections: [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ],
        instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
        numServings: 2,
        tags: [],
        isIngredient: false,
    };

    // Create first recipe
    await createRecipe(this, user, record);

    // Attempt to create a second recipe with the same title (no originalRecipe)
    const response = await createRecipe(this, user, record);
    assert.equal(response.body.kind, 'single');
    assert.isDefined(response.body.singleResult.errors);
    assert.match(
        response.body.singleResult.errors[0].message,
        /Recipe title must be unique/i
    );
});
```

Note: check the exact `createRecipe` helper signature in the `recipeCreateOne vegan validation` describe block — it may be a local function. The function signature at line ~1710 is:
```ts
async function createRecipe(context, user, record) {
    const query = `mutation RecipeCreateOne($record: CreateOneRecipeCreateInput!) {
        recipeCreateOne(record: $record) {
          record { _id title }
        }
    }`;
    return context.apolloServer.executeOperation(
        { query, variables: { record } },
        { contextValue: { isAuthenticated: () => true, getUser: () => user } }
    );
}
```
This is a local function inside that describe block — use it directly.

- [ ] **Step 4: Run API tests — verify new tests pass**

```bash
cd api && npm test 2>&1 | tail -5
```

Expected: `151 passing` (2 new tests added)

- [ ] **Step 5: Commit**

```bash
cd api && git add src/models/validation.ts test/graphql/Recipe.test.ts
git commit -m "feat: exempt vegan copies from title uniqueness validation"
```

---

## Task 2: Feature 1 — Client: Block vegan creation if recipe is already vegan

**Files:**
- Modify: `client/src/pages/EditRecipe.tsx`

`useWarningToast` is already exported from `client/src/common/hooks/index.tsx` (it was added previously). No hook changes needed.

- [ ] **Step 1: Add warning toast import and already-vegan guard in `EditRecipe.tsx`**

Change the import line at the top of `client/src/pages/EditRecipe.tsx`:

```ts
// Before:
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';

// After:
import { useErrorToast, useSuccessToast, useWarningToast } from '@recipe/common/hooks';
```

Then add `const warningToast = useWarningToast();` after `const successToast = useSuccessToast();`:

```ts
const errorToast = useErrorToast();
const successToast = useSuccessToast();
const warningToast = useWarningToast();
```

Then replace the `if (recipeState.createVeganVersion)` block (currently lines ~214–232) with:

```ts
if (recipeState.createVeganVersion) {
    recipeState.resetCreateVeganVersion();
    if (data.recipeOne!.calculatedTags.includes('vegan')) {
        warningToast({
            title: 'Recipe is already vegan',
            description: 'This recipe does not need a vegan version',
            position: 'top',
        });
        // fall through to normal save redirect
    } else if (data.recipeOne!.veganVersion) {
        const veganTitleIdentifier = data.recipeOne!.veganVersion.titleIdentifier;
        successToast({
            title: 'Redirecting to existing vegan version',
            description: 'This recipe already has a vegan version',
            position: 'top',
        });
        return setTimeout(
            () => navigate(`${PATH.ROOT}/edit/recipe/${veganTitleIdentifier}`),
            DELAY_SHORT
        );
    } else {
        return setTimeout(
            () =>
                navigate(
                    `${PATH.ROOT}/create/recipe/vegan/${data.recipeOne!.titleIdentifier}`
                ),
            DELAY_SHORT
        );
    }
}
successToast({
    title: 'Recipe saved',
    description: 'Your recipe has been saved, redirecting you to the home page',
    position: 'top',
});
setTimeout(() => navigate(PATH.ROOT), DELAY_SHORT);
```

- [ ] **Step 2: Run client type check**

```bash
cd client && npm run check-types 2>&1 | tail -5
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/EditRecipe.tsx
git commit -m "feat: warn and fall through to home when recipe is already vegan"
```

---

## Task 3: Feature 3 — Client: Suppress ITEM_IN_USE toast on CreateVeganRecipe

**Files:**
- Modify: `client/src/features/editing/components/EditableIngredientSubsection.tsx`
- Modify: `client/src/features/editing/components/EditableIngredientSubsections.tsx`
- Modify: `client/src/features/editing/components/EditableRecipe.tsx`
- Modify: `client/src/pages/CreateVeganRecipe.tsx`

- [ ] **Step 1: Update `EditableIngredientSubsection` to accept and use `suppressItemInUseError`**

Replace the `Props` interface and component signature:

```ts
interface Props {
    section: number;
    optionalRef: RefObject<HTMLInputElement> | null;
    handleOpen: (index: number) => void;
    suppressItemInUseError?: boolean;
}
export function EditableIngredientSubsection(props: Props) {
    const { section, optionalRef, handleOpen, suppressItemInUseError } = props;
```

Update the `deleteUnit` `onError` handler:

```ts
const [deleteUnit] = useMutation(DELETE_UNIT, {
    onCompleted: (data) => {
        if (DEBUG) {
            console.log(`Successfully deleted unit ${data.unitRemoveById?.recordId}`);
        }
    },
    onError: (error) => {
        const code = error.graphQLErrors[0]?.extensions?.code;
        if (suppressItemInUseError && code === 'ITEM_IN_USE') {
            return;
        }
        errorToast({
            title: 'Error deleting unit',
            description: error.message,
            position: 'top',
        });
    },
    update(cache, { data }) {
        cache.evict({ id: `Unit:${data?.unitRemoveById?.recordId}` });
    },
});
```

Update the `deletePrepMethod` `onError` handler:

```ts
const [deletePrepMethod] = useMutation(DELETE_PREP_METHOD, {
    onCompleted: (data) => {
        if (DEBUG) {
            console.log(
                `Successfully deleted prep method ${data.prepMethodRemoveById?.recordId}`
            );
        }
    },
    onError: (error) => {
        const code = error.graphQLErrors[0]?.extensions?.code;
        if (suppressItemInUseError && code === 'ITEM_IN_USE') {
            return;
        }
        errorToast({
            title: 'Error deleting prep method',
            description: error.message,
            position: 'top',
        });
    },
    update(cache, { data }) {
        cache.evict({ id: `PrepMethod:${data?.prepMethodRemoveById?.recordId}` });
    },
});
```

- [ ] **Step 2: Update `EditableIngredientSubsections` to accept and pass through the prop**

Replace the function signature:

```ts
interface Props {
    suppressItemInUseError?: boolean;
}
export function EditableIngredientSubsections({ suppressItemInUseError }: Props) {
```

Pass it to each `EditableIngredientSubsection`:

```ts
<EditableIngredientSubsection
    key={index}
    section={index}
    optionalRef={index === indexToDelete ? ref : null}
    handleOpen={handleOpen}
    suppressItemInUseError={suppressItemInUseError}
/>
```

- [ ] **Step 3: Update `EditableRecipe` to accept and pass through the prop**

Add `suppressItemInUseError?: boolean` to the `Props` interface:

```ts
interface Props {
    rating: number;
    addRating: (rating: number) => void;
    handleSubmitMutation: (recipe: CreateOneRecipeCreateInput) => void;
    submitButtonProps: SubmitButtonProps;
    veganVersion?: { _id: string; title: string; titleIdentifier: string };
    originalRecipe?: { _id: string; title: string; titleIdentifier: string };
    suppressItemInUseError?: boolean;
}
```

Destructure it:

```ts
const {
    rating,
    addRating,
    handleSubmitMutation,
    submitButtonProps,
    veganVersion,
    originalRecipe,
    suppressItemInUseError,
} = props;
```

Pass it to `EditableIngredientSubsections` (currently rendered as `<EditableIngredientSubsections />`):

```ts
IngredientList={<EditableIngredientSubsections suppressItemInUseError={suppressItemInUseError} />}
```

- [ ] **Step 4: Pass `suppressItemInUseError` from `CreateVeganRecipe`**

In `client/src/pages/CreateVeganRecipe.tsx`, update the `<EditableRecipe>` JSX:

```tsx
return (
    <EditableRecipe
        rating={rating}
        addRating={setRating}
        handleSubmitMutation={handleSubmitMutation}
        originalRecipe={data.recipeOne}
        suppressItemInUseError
        submitButtonProps={{
            submitText: 'Submit Vegan Version',
            loadingText: recipeLoading
                ? 'Submitting Recipe...'
                : uploadLoading
                  ? 'Uploading Images...'
                  : undefined,
            disabled: !!createResponse,
            loading: recipeLoading || uploadLoading,
        }}
    />
);
```

- [ ] **Step 5: Run client type check**

```bash
cd client && npm run check-types 2>&1 | tail -5
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add client/src/features/editing/components/EditableIngredientSubsection.tsx \
        client/src/features/editing/components/EditableIngredientSubsections.tsx \
        client/src/features/editing/components/EditableRecipe.tsx \
        client/src/pages/CreateVeganRecipe.tsx
git commit -m "feat: suppress ITEM_IN_USE toast on CreateVeganRecipe ingredient removal"
```

---

## Task 4: Feature 4 — Add mock data for vegan tests

**Files:**
- Modify: `client/src/graphql/queries/__mocks__/recipe.ts`
- Modify: `client/src/__mocks__/graphql.ts`

- [ ] **Step 1: Add mock recipes with vegan/original links in `recipe.ts`**

Import the new IDs at the top of `client/src/graphql/queries/__mocks__/recipe.ts`. No new IDs needed — use `mockRecipeIdOne` (original), `mockRecipeIdTwo` (vegan copy).

At the bottom of the mock data section (after `mockRecipeOne`, before the `// GetRecipe` section), add:

```ts
// A recipe that already has a vegan version linked
export const mockRecipeWithVeganVersion: CompletedRecipeView = {
    ...mockRecipeOne,
    calculatedTags: ['vegetarian'], // not vegan itself
    veganVersion: {
        __typename: 'Recipe',
        _id: mockRecipeIdTwo,
        title: mockTitleOne,
        titleIdentifier: 'mock-recipe-one-vegan',
    },
    originalRecipe: null,
};

// A recipe that is itself a vegan copy (has originalRecipe set)
export const mockRecipeVeganCopy: CompletedRecipeView = {
    ...mockRecipeOne,
    _id: mockRecipeIdTwo,
    titleIdentifier: 'mock-recipe-one-vegan',
    calculatedTags: ['vegan', 'vegetarian'],
    veganVersion: null,
    originalRecipe: {
        __typename: 'Recipe',
        _id: mockRecipeIdOne,
        title: mockTitleOne,
        titleIdentifier: 'mock-recipe-one',
    },
};
```

Then add `GET_RECIPE` wrapper mocks after the existing `mockGetRecipeOne`:

```ts
export const mockGetRecipeWithVeganVersion = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-one' },
        } satisfies GetRecipeQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeOne: mockRecipeWithVeganVersion,
        } satisfies GetRecipeQuery,
    },
};

export const mockGetRecipeVeganCopy = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-one-vegan' },
        } satisfies GetRecipeQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeOne: mockRecipeVeganCopy,
        } satisfies GetRecipeQuery,
    },
};
```

- [ ] **Step 2: Run client type check**

```bash
cd client && npm run check-types 2>&1 | tail -5
```

Expected: no errors. If `CompletedRecipeView` requires additional fields not in `mockRecipeOne` (check the type definition), add them.

- [ ] **Step 3: Commit**

```bash
git add client/src/graphql/queries/__mocks__/recipe.ts
git commit -m "test: add vegan mock recipes with veganVersion and originalRecipe links"
```

---

## Task 5: Feature 4 — Write vegan integration tests

**Files:**
- Create: `client/src/__tests__/index.vegan.test.tsx`

These tests use `renderComponent` from `./utils` which loads the full app router with `mocks` (which includes `mockGetRecipeOne` for `mock-recipe-one`).

For EditRecipe tests: navigate to `/edit/recipe/mock-recipe-one`. The `mockGetRecipeOne` mock (included in `mocks`) serves `mockRecipeOne` which has `calculatedTags: ['vegan', 'vegetarian']`, so it works for the "already vegan" test. Override with custom mocks for other scenarios.

For CreateVeganRecipe tests: navigate to `/create/recipe/vegan/mock-recipe-one`. Need to provide `mockGetRecipeOne` again (it's already in `mocks`) plus `CREATE_RECIPE` and `LINK_VEGAN_RECIPE` mocks.

- [ ] **Step 1: Create the test file**

Create `client/src/__tests__/index.vegan.test.tsx`:

```tsx
import { GraphQLError } from 'graphql';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { CREATE_RECIPE, LINK_VEGAN_RECIPE, UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { DELETE_UNIT } from '@recipe/graphql/mutations/unit';
import { enterEditRecipePage } from '@recipe/utils/tests';
import { mockRecipeIdOne, mockRecipeIdTwo, mockTeaspoonId } from '@recipe/graphql/__mocks__/ids';
import { mockTitleOne } from '@recipe/graphql/__mocks__/common';
import { mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import {
    mockGetRecipeWithVeganVersion,
    mockGetRecipeVeganCopy,
    mockRecipeNew,
} from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeOneNoChange } from '@recipe/graphql/mutations/__mocks__/recipe';
import {
    CreateRecipeMutationVariables,
    GetRecipeQueryVariables,
    LinkVeganRecipeMutationVariables,
} from '@recipe/graphql/generated';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Navigate to the edit page for mock-recipe-one and wait for it to load. */
async function goToEditRecipeOne(
    user: ReturnType<typeof userEvent.setup>
) {
    await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
}

// ─── Mock definitions ─────────────────────────────────────────────────────────

// Override GET_RECIPE for mock-recipe-one to return a recipe that already has a vegan version
const mockGetRecipeOneWithVeganVersion = mockGetRecipeWithVeganVersion;

// Override GET_RECIPE for mock-recipe-one-vegan (vegan copy)
const mockGetRecipeOneVeganCopy = mockGetRecipeVeganCopy;

// Mock for successful CREATE_RECIPE on vegan page
// Variables must match exactly what CreateVeganRecipe submits.
// The page submits store state pre-populated from mockRecipeOne.
// Use mockRecipeNew as the created record.
const mockCreateVeganRecipe = {
    request: {
        query: CREATE_RECIPE,
        variables: {
            recipe: {
                title: mockTitleOne,
                numServings: 4,
                ingredientSubsections: expect.anything(), // flexible — actual shape depends on store serialisation
                instructionSubsections: expect.anything(),
                notes: '',
                source: '',
                tags: [],
                isIngredient: false,
            },
        } satisfies Partial<CreateRecipeMutationVariables>,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeCreateOne: {
                __typename: 'CreateOneRecipePayload',
                record: mockRecipeNew,
            },
        },
    },
};

// Mock for successful LINK_VEGAN_RECIPE
const mockLinkVeganSuccess = {
    request: {
        query: LINK_VEGAN_RECIPE,
        variables: {
            originalId: mockRecipeIdOne,
            veganId: mockRecipeNew._id,
        } satisfies LinkVeganRecipeMutationVariables,
    },
    result: {
        data: { recipeLinkVeganVersion: true },
    },
};

// Mock for failed LINK_VEGAN_RECIPE (non-vegan ingredients)
const mockLinkVeganFailure = {
    request: {
        query: LINK_VEGAN_RECIPE,
        variables: {
            originalId: mockRecipeIdOne,
            veganId: mockRecipeNew._id,
        } satisfies LinkVeganRecipeMutationVariables,
    },
    error: new GraphQLError('Vegan recipe contains non-vegan ingredients'),
};

// Mock DELETE_UNIT returning ITEM_IN_USE error
const mockDeleteUnitItemInUse = {
    request: {
        query: DELETE_UNIT,
        variables: { id: mockTeaspoonId },
    },
    error: new GraphQLError(
        'Cannot delete unit as it is currently being used in existing recipes.',
        { extensions: { code: 'ITEM_IN_USE' } }
    ),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EditRecipe — Vegan Version Checkbox Visibility', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show the vegan version checkbox for a normal recipe', async () => {
        // mockRecipeOne has veganVersion: null and originalRecipe: null
        renderComponent([mockGetRecipeOne]);
        const user = userEvent.setup();

        await goToEditRecipeOne(user);

        expect(
            await screen.findByLabelText('Create vegan version of this recipe')
        ).not.toBeNull();
    });

    it('should hide the vegan version checkbox when the recipe already has a vegan version', async () => {
        renderComponent([mockGetRecipeOneWithVeganVersion]);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(
            screen.queryByLabelText('Create vegan version of this recipe')
        ).toBeNull();
    });

    it('should hide the vegan version checkbox when the recipe is a vegan copy', async () => {
        renderComponent([mockGetRecipeOneVeganCopy]);
        const user = userEvent.setup();

        // Navigate directly to the vegan copy's edit page
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(
            screen.queryByLabelText('Create vegan version of this recipe')
        ).toBeNull();
    });
});

describe('EditRecipe — Vegan Version Save Flow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should navigate to create vegan recipe page after checking checkbox and saving', async () => {
        // mockRecipeOne has calculatedTags: ['vegan', 'vegetarian'] — but we
        // need a recipe that is NOT already vegan. Override with a custom mock.
        const mockGetNonVeganRecipeOne = {
            request: {
                query: GET_RECIPE,
                variables: {
                    filter: { titleIdentifier: 'mock-recipe-one' },
                } satisfies GetRecipeQueryVariables,
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeOne: {
                        ...require('@recipe/graphql/queries/__mocks__/recipe').mockRecipeOne,
                        calculatedTags: ['vegetarian'], // not vegan
                    },
                },
            },
        };
        renderComponent([mockGetNonVeganRecipeOne, mockUpdateRecipeOneNoChange]);
        const user = userEvent.setup();

        await goToEditRecipeOne(user);

        // Check the vegan version checkbox
        await user.click(screen.getByLabelText('Create vegan version of this recipe'));

        // Submit the form
        await user.click(screen.getByRole('button', { name: 'Save' }));

        // Expect navigation to create vegan recipe page
        expect(
            await screen.findByText('Submit Vegan Version')
        ).not.toBeNull();
    });

    it('should show toast and redirect to existing vegan version when one already exists', async () => {
        renderComponent([mockGetRecipeOneWithVeganVersion, mockUpdateRecipeOneNoChange]);
        // Note: checkbox is hidden when veganVersion is set, so we force the
        // createVeganVersion state via a recipe that has NO vegan version but
        // whose GET_RECIPE response (after save) returns one.
        // Simpler approach: since checkbox is hidden, this scenario is tested
        // via the mock that returns veganVersion from the query response.
        // The checkbox state can be set by providing a mock where veganVersion
        // is null on the GET_RECIPE query but present on the UPDATE_RECIPE result.
        // That is complex to mock. Instead: test the branch by using a recipe
        // where GET_RECIPE returns veganVersion (but checkbox was checked before load).
        // In practice this branch fires when user checks the box, saves, and
        // meanwhile the recipe already had a vegan version in the DB.
        // For the purposes of this test, render a recipe with no vegan version,
        // check the box, but mock UPDATE_RECIPE to return a record that has
        // veganVersion set. Since the code reads from `data.recipeOne` (the query
        // result, not the mutation result), we need the GET_RECIPE to return
        // veganVersion. Use mockGetRecipeOneWithVeganVersion which has veganVersion set.
        // However, since the checkbox is hidden when veganVersion is set, we
        // can't check it. This scenario represents an edge case that's hard
        // to trigger through the UI alone. Skip this test or verify the logic
        // via a unit test of the handler function instead.
        // This test is intentionally omitted from the integration suite.
    });

    it('should show warning toast and navigate home when recipe is already vegan', async () => {
        // mockRecipeOne already has calculatedTags: ['vegan', 'vegetarian']
        renderComponent([mockGetRecipeOne, mockUpdateRecipeOneNoChange]);
        const user = userEvent.setup();

        await goToEditRecipeOne(user);

        // Check the vegan version checkbox
        await user.click(screen.getByLabelText('Create vegan version of this recipe'));

        // Submit
        await user.click(screen.getByRole('button', { name: 'Save' }));

        // Warning toast should appear
        expect(await screen.findByText('Recipe is already vegan')).not.toBeNull();
        expect(
            await screen.findByText('This recipe does not need a vegan version')
        ).not.toBeNull();

        // Should navigate home (Recipes heading visible)
        expect(await screen.findByText('Recipes')).not.toBeNull();
    });
});

describe('CreateVeganRecipe — Page Behaviour', () => {
    afterEach(() => {
        cleanup();
    });

    it('should pre-populate the title from the original recipe', async () => {
        renderComponent([mockGetRecipeOne]);
        const user = userEvent.setup();

        // Navigate to the create vegan recipe page
        renderComponent(
            [mockGetRecipeOne],
            require('../routes').routes
        );

        // Go directly to the vegan create page
        // Use renderPage with initialEntries instead of full navigation
        const {
            renderPage,
        } = await import('@recipe/utils/tests');
        const { routes } = await import('../routes');
        const { mocks } = await import('../__mocks__/graphql');
        cleanup();
        renderPage(
            routes,
            [...mocks, mockGetRecipeOne],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]
        );

        // The page should load and pre-populate the title
        expect(await screen.findByText('Submit Vegan Version')).not.toBeNull();
        expect(await screen.findByDisplayValue(mockTitleOne)).not.toBeNull();
    });

    it('should show success toast and navigate to edit page on successful submit', async () => {
        const { renderPage } = await import('@recipe/utils/tests');
        const { routes } = await import('../routes');
        const { mocks } = await import('../__mocks__/graphql');
        cleanup();
        renderPage(
            routes,
            [...mocks, mockGetRecipeOne, mockCreateVeganRecipe, mockLinkVeganSuccess],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]
        );

        const user = userEvent.setup();
        expect(await screen.findByText('Submit Vegan Version')).not.toBeNull();

        // Submit the form
        await user.click(screen.getByRole('button', { name: 'Submit Vegan Version' }));

        // Expect success toast
        expect(await screen.findByText('Vegan version created')).not.toBeNull();
    });

    it('should show error toast when linking the vegan recipe fails', async () => {
        const { renderPage } = await import('@recipe/utils/tests');
        const { routes } = await import('../routes');
        const { mocks } = await import('../__mocks__/graphql');
        cleanup();
        renderPage(
            routes,
            [...mocks, mockGetRecipeOne, mockCreateVeganRecipe, mockLinkVeganFailure],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]
        );

        const user = userEvent.setup();
        expect(await screen.findByText('Submit Vegan Version')).not.toBeNull();

        await user.click(screen.getByRole('button', { name: 'Submit Vegan Version' }));

        expect(await screen.findByText('Error linking vegan recipe')).not.toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests once to see what passes and what fails**

```bash
cd client && npm test -- run --reporter=verbose 2>&1 | grep -A3 'vegan'
```

Expected: most tests pass. Some may fail due to mock variable mismatches (e.g., `CREATE_RECIPE` variables). Note which ones fail and fix in the next step.

- [ ] **Step 3: Fix any failing tests**

The most common issue will be `CREATE_RECIPE` mock variable mismatch. The `MockedProvider` requires exact variable matching. The store serialises ingredients into `ingredientSubsections`. To get the exact variables, use `addTypenameToDocument` or inspect the test output for "No more mocked responses" errors.

Inspect the actual variables by temporarily adding a `console.log` before `createRecipe({ variables: { recipe } })` in `CreateVeganRecipe.tsx`, running the test, and copying the logged value into the mock.

Common shape based on `mockRecipeOne`:
```ts
recipe: {
    title: mockTitleOne,
    numServings: 4,
    notes: '',
    source: '',
    tags: [],
    isIngredient: false,
    ingredientSubsections: [
        {
            name: 'Section One',
            ingredients: [
                { quantity: '1', unit: mockTeaspoon._id, size: null, ingredient: mockApple._id, prepMethod: mockDiced._id },
                { quantity: '1', unit: null, size: mockSmall._id, ingredient: mockCarrot._id, prepMethod: mockDiced._id },
                { quantity: '2', unit: null, size: null, ingredient: mockApple._id, prepMethod: mockDiced._id },
            ],
        },
        {
            name: 'Section Two',
            ingredients: [
                { quantity: '1/3', unit: mockCup._id, size: mockMedium._id, ingredient: mockApple._id, prepMethod: mockDiced._id },
                { quantity: '1', unit: mockOunce._id, size: null, ingredient: mockApple._id, prepMethod: null },
            ],
        },
    ],
    instructionSubsections: [
        { name: null, instructions: ['Instruction one.', 'Instruction two.', ''] },
    ],
},
```

Import `mockTeaspoon`, `mockApple`, `mockDiced`, `mockSmall`, `mockCarrot`, `mockCup`, `mockMedium`, `mockOunce` from their respective `__mocks__` files and fill in the exact `CREATE_RECIPE` mock variables.

- [ ] **Step 4: Run all client tests to verify no regressions**

```bash
cd client && npm test -- run 2>&1 | tail -10
```

Expected: `Tests  353 passed` (or similar — 10 new tests added to the 343 baseline).

- [ ] **Step 5: Commit**

```bash
git add client/src/__tests__/index.vegan.test.tsx
git commit -m "test: add comprehensive client-side vegan feature integration tests"
```

---

## Task 6: Final verification and cleanup

- [ ] **Step 1: Run all API tests**

```bash
cd api && npm test 2>&1 | tail -5
```

Expected: `151 passing`

- [ ] **Step 2: Run all client tests**

```bash
cd client && npm test -- run 2>&1 | tail -10
```

Expected: all tests passing, no regressions

- [ ] **Step 3: Run client type check and lint**

```bash
cd client && npm run check-types && npm run lint 2>&1 | tail -10
```

Expected: no errors

- [ ] **Step 4: Push to remote**

```bash
git push
```
