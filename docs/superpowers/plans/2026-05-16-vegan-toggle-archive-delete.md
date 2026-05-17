# Vegan Toggle, Archive, and Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace linked vegan/original text links with an icon toggle on the view page, add archive-or-delete actions to edit recipe, and keep linked recipe and home-page cache state correct without refresh.

**Architecture:** This work stays inside the existing recipe flow. The API keeps ownership of linked original/vegan lifecycle rules by extending the existing archive/unarchive/remove resolvers and exposing the already-implemented remove mutation for vegan delete. The client reuses the current ingredient-header control row and confirmation modal styling, then centralizes recipe archive/delete cache updates in the editing feature so home-page and linked recipe nodes stay synchronized.

**Tech Stack:** React 18, TypeScript, Apollo Client 3, GraphQL Compose, Mongoose 7, Vitest + Testing Library, Mocha + Chai, Mantine 8, Chakra UI 2.

---

## File Map

| File | Change |
|------|--------|
| `client/src/pages/ViewRecipe.tsx` | Remove title-area text links; pass linked recipe action into ingredients tab |
| `client/src/features/viewing/components/IngredientsTab.tsx` | Accept linked recipe action prop and forward to `IngredientList` |
| `client/src/features/viewing/components/IngredientList.tsx` | Render linked-recipe icon button left of wake-lock button |
| `client/src/features/editing/components/EditableRecipe.tsx` | Replace single save button area with dual action area props |
| `client/src/features/editing/components/SubmitButton.tsx` | Keep submit validation logic but become composable within shared action row |
| `client/src/features/editing/components/ConfirmArchiveModal.tsx` | Generalize into a configurable confirm modal while preserving current Mantine styling |
| `client/src/features/editing/components/RecipeActionButtons.tsx` | New shared fixed action-row component for save + destructive action |
| `client/src/features/editing/index.tsx` | Export any new shared action or confirm components/helpers |
| `client/src/pages/EditRecipe.tsx` | Add archive/delete mutation wiring, modal state, redirect, and cache update integration |
| `client/src/features/editing/utils/update.ts` | Add shared cache helpers for archive/delete/link cleanup |
| `client/src/graphql/mutations/recipe.ts` | Add client `DELETE_RECIPE` mutation document |
| `client/src/graphql/mutations/__mocks__/recipe.ts` | Add delete and linked-archive mocks used by client tests |
| `client/src/graphql/queries/__mocks__/recipe.ts` | Add distinct-ID linked recipe fixtures for archive/delete tests |
| `client/src/__tests__/index.vegan.test.tsx` | Add view-page icon toggle and edit-page archive/delete integration tests |
| `api/src/schema/Recipe.ts` | Extend archive/unarchive linked behavior; keep vegan delete cleanup explicit |
| `api/src/schema/index.ts` | Expose `recipeRemoveById` for recipe owners/admins |
| `api/test/graphql/Recipe.test.ts` | Add resolver tests for linked archive/unarchive and vegan delete cleanup |

---

## Task 1: Add API tests for linked archive/unarchive and vegan delete cleanup

**Files:**
- Modify: `api/test/graphql/Recipe.test.ts:1198-1690`

### Context

The API already has tests around `recipeArchiveById` and `recipeLinkVeganVersion`, but it does not yet prove the new linked lifecycle rules. The fastest way to avoid implementation drift is to write these tests first in the existing `Recipe.test.ts` describe blocks.

There is no public `recipeRemoveById` mutation in the current schema, so the delete-cleanup test must be added after the schema exposure step in Task 2. For now, write the failing tests in the same file so the API implementation has a clear target.

- [ ] **Step 1: Write the failing archive/unarchive tests**

Add these tests inside the existing `describe('recipeArchiveById', ...)` block in `api/test/graphql/Recipe.test.ts`:

```ts
    it('should archive an original recipe and its vegan version', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
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
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const original = await Recipe.create({
            title: 'Tomato Soup',
            titleIdentifier: 'tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: false,
        });
        const vegan = await Recipe.create({
            title: 'Vegan Tomato Soup',
            titleIdentifier: 'vegan-tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: false,
            originalRecipe: original._id,
        });
        original.veganVersion = vegan._id;
        await original.save();

        const response = await archiveRecipe(this, user, original._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);

        const [archivedOriginal, archivedVegan] = await Promise.all([
            Recipe.findById(original._id),
            Recipe.findById(vegan._id),
        ]);
        assert.isTrue(archivedOriginal.archived, 'Original recipe should be archived');
        assert.isTrue(archivedVegan.archived, 'Linked vegan version should be archived');
    });

    it('should unarchive an original recipe and its vegan version', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
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
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const original = await Recipe.create({
            title: 'Tomato Soup',
            titleIdentifier: 'tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: true,
        });
        const vegan = await Recipe.create({
            title: 'Vegan Tomato Soup',
            titleIdentifier: 'vegan-tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: true,
            originalRecipe: original._id,
        });
        original.veganVersion = vegan._id;
        await original.save();

        const response = await unarchiveRecipe(this, user, original._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);

        const [unarchivedOriginal, unarchivedVegan] = await Promise.all([
            Recipe.findById(original._id),
            Recipe.findById(vegan._id),
        ]);
        assert.isFalse(unarchivedOriginal.archived, 'Original recipe should be unarchived');
        assert.isFalse(unarchivedVegan.archived, 'Linked vegan version should be unarchived');
    });
```

- [ ] **Step 2: Write the failing vegan delete cleanup test**

Add this test in a new `describe('recipeRemoveById', ...)` block after `describe('recipeLinkVeganVersion', ...)`:

```ts
describe('recipeRemoveById', () => {
    before(startServer);
    after(stopServer);
    beforeEach(createRecipeIngredientData);
    afterEach(removeRecipeIngredientData);

    async function removeRecipe(context, user, id) {
        const query = `
        mutation RecipeRemoveById($id: MongoID!) {
            recipeRemoveById(_id: $id) {
                recordId
            }
        }`;
        return context.apolloServer.executeOperation(
            { query, variables: { id } },
            { contextValue: { isAuthenticated: () => true, getUser: () => user } }
        );
    }

    it('should delete a vegan version and clear veganVersion on the original recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
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
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const original = await Recipe.create({
            title: 'Tomato Soup',
            titleIdentifier: 'tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: false,
        });
        const vegan = await Recipe.create({
            title: 'Vegan Tomato Soup',
            titleIdentifier: 'vegan-tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: false,
            originalRecipe: original._id,
        });
        original.veganVersion = vegan._id;
        await original.save();

        const response = await removeRecipe(this, user, vegan._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);

        const [deletedVegan, updatedOriginal] = await Promise.all([
            Recipe.findById(vegan._id),
            Recipe.findById(original._id),
        ]);
        assert.isNull(deletedVegan, 'Vegan version should be deleted');
        assert.isUndefined(updatedOriginal.veganVersion, 'Original recipe should lose veganVersion');
        assert.notInclude(
            updatedOriginal.calculatedTags,
            'vegan version available',
            'Original recipe should lose vegan version available calculated tag'
        );
    });
});
```

- [ ] **Step 3: Run the archive/unarchive tests to verify they fail**

Run:

```bash
cd api && npm test -- --grep "recipeArchiveById"
```

Expected: the new linked archive/unarchive tests fail because only the original recipe changes archive state today.

- [ ] **Step 4: Run the delete cleanup test to verify it fails for the schema reason**

Run:

```bash
cd api && npm test -- --grep "recipeRemoveById"
```

Expected: FAIL with `Cannot query field "recipeRemoveById"` because the mutation is not exposed in `api/src/schema/index.ts` yet.

- [ ] **Step 5: Commit the failing API tests**

```bash
git add api/test/graphql/Recipe.test.ts
git commit -m "test: cover linked recipe archive and vegan delete"
```

---

## Task 2: Expose recipe removal and implement linked API lifecycle rules

**Files:**
- Modify: `api/src/schema/index.ts:65-76`
- Modify: `api/src/schema/Recipe.ts:184-205,278-315,359-365`
- Test: `api/test/graphql/Recipe.test.ts`

### Context

The delete behavior already exists in `recipeRemoveById` inside `api/src/schema/Recipe.ts`, but it is not added to `schemaComposer.Mutation`, so the client cannot call it. The archive/unarchive resolvers are also too narrow: they only update one document.

Keep the GraphQL API surface minimal by reusing `recipeRemoveById` instead of inventing a specialized vegan-delete mutation.

- [ ] **Step 1: Expose `recipeRemoveById` to recipe owners/admins**

Update `api/src/schema/index.ts` inside `isRecipeOwnerOrAdminMutations`:

```ts
const isRecipeOwnerOrAdminMutations = composeResolvers(
    {
        Mutation: {
            recipeUpdateById: RecipeMutation.recipeUpdateById,
            recipeArchiveById: RecipeMutation.recipeArchiveById,
            recipeUnarchiveById: RecipeMutation.recipeUnarchiveById,
            recipeRemoveById: RecipeMutation.recipeRemoveById,
            imageUploadOne: ImageMutation.imageUploadOne,
            imageUploadMany: ImageMutation.imageUploadMany,
        },
    },
    { 'Mutation.*': [isDocumentOwnerOrAdmin(Recipe)] }
);
```

- [ ] **Step 2: Make `archiveById` archive linked vegan versions when archiving an original**

Replace the resolver body in `api/src/schema/Recipe.ts`:

```ts
RecipeModifyTC.addResolver({
    name: 'archiveById',
    description: 'Archive a recipe by its ID',
    type: RecipeTC.mongooseResolvers.removeById().getType(),
    args: { _id: 'MongoID!' },
    resolve: async ({ args }) => {
        const recipe = await Recipe.findById(args._id);
        if (!recipe) {
            return { recordId: undefined, record: null };
        }

        const updates = [
            Recipe.findByIdAndUpdate(recipe._id, { archived: true }, { new: true }),
        ];
        if (!recipe.originalRecipe && recipe.veganVersion) {
            updates.push(Recipe.findByIdAndUpdate(recipe.veganVersion, { archived: true }, { new: true }));
        }

        const [record] = await Promise.all(updates);
        return { recordId: record?._id, record };
    },
});
```

- [ ] **Step 3: Make `unarchiveById` unarchive linked vegan versions when unarchiving an original**

Replace the resolver body in `api/src/schema/Recipe.ts`:

```ts
RecipeModifyTC.addResolver({
    name: 'unarchiveById',
    description: 'Unarchive a recipe by its ID',
    type: RecipeTC.mongooseResolvers.removeById().getType(),
    args: { _id: 'MongoID!' },
    resolve: async ({ args }) => {
        const recipe = await Recipe.findById(args._id);
        if (!recipe) {
            return { recordId: undefined, record: null };
        }

        const updates = [
            Recipe.findByIdAndUpdate(recipe._id, { archived: false }, { new: true }),
        ];
        if (!recipe.originalRecipe && recipe.veganVersion) {
            updates.push(Recipe.findByIdAndUpdate(recipe.veganVersion, { archived: false }, { new: true }));
        }

        const [record] = await Promise.all(updates);
        return { recordId: record?._id, record };
    },
});
```

- [ ] **Step 4: Keep vegan delete cleanup explicit and robust**

Tighten the existing `recipeRemoveById` cleanup block in `api/src/schema/Recipe.ts` so it explicitly removes the back-reference and recalculates tags:

```ts
            const result = await next(rp);
            const record = result?.record;
            if (record?.originalRecipe) {
                const original = await Recipe.findById(record.originalRecipe);
                if (original) {
                    original.veganVersion = undefined;
                    await original.save();
                }
            }
            if (record?.veganVersion) {
                await Recipe.findByIdAndUpdate(record.veganVersion, {
                    $unset: { originalRecipe: 1 },
                });
            }
            return result;
```

The key requirement is that the original no longer reports `vegan version available` after its vegan copy is deleted.

- [ ] **Step 5: Run the targeted API tests to verify they pass**

Run:

```bash
cd api && npm test -- --grep "recipeArchiveById|recipeRemoveById"
```

Expected: PASS for the new linked archive/unarchive and vegan delete cleanup tests.

- [ ] **Step 6: Run API typecheck**

Run:

```bash
cd api && ./node_modules/.bin/tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit the API behavior changes**

```bash
git add api/src/schema/index.ts api/src/schema/Recipe.ts api/test/graphql/Recipe.test.ts
git commit -m "feat: support linked recipe archive and vegan delete"
```

---

## Task 3: Regenerate GraphQL types after exposing recipe removal

**Files:**
- Generated locally: `client/src/__generated__/graphql.ts`

### Context

The client uses typed `gql()` documents from generated GraphQL output. After exposing `recipeRemoveById` in the API schema, regenerate the client GraphQL types before adding the new `DELETE_RECIPE` operation.

- [ ] **Step 1: Compile the API**

Run:

```bash
cd api && npm run compile
```

Expected: PASS.

- [ ] **Step 2: Start the API for codegen**

Run in a separate shell:

```bash
cd api && NODE_ENV=development node ./dist/src/index.js
```

Expected: server starts on port `4004`.

- [ ] **Step 3: Regenerate client GraphQL types**

Run:

```bash
cd client && npm run generate
```

Expected: PASS and local generated GraphQL types update.

- [ ] **Step 4: Stop the API server**

Stop the API process started in Step 2.

- [ ] **Step 5: Continue without committing generated files if they remain gitignored**

`client/src/__generated__/graphql.ts` is gitignored in this repo. Do not force-add it.

---

## Task 4: Add view-page linked recipe icon toggle

**Files:**
- Modify: `client/src/pages/ViewRecipe.tsx:1-89`
- Modify: `client/src/features/viewing/components/IngredientsTab.tsx:15-57`
- Modify: `client/src/features/viewing/components/IngredientList.tsx:1-91`
- Test: `client/src/__tests__/index.vegan.test.tsx`

### Context

The title card currently renders `View Original Recipe` and `View Vegan Version` text links. The wake-lock button already lives in `IngredientList`, so the cleanest switch is to pass one linked-recipe action object from `ViewRecipe` to `IngredientsTab` to `IngredientList`.

- [ ] **Step 1: Write the failing client tests for the linked icon toggle**

Add this describe block to `client/src/__tests__/index.vegan.test.tsx`:

```tsx
describe('ViewRecipe — linked recipe icon toggle', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show a plant icon button that links to the vegan version from the original recipe view', async () => {
        renderPage(routes, [...mocksMinimal, mockGetRecipeWithVeganVersion], [
            `${PATH.ROOT}/view/recipe/mock-recipe-one`,
        ]);

        const button = await screen.findByLabelText('View vegan version');
        expect(button).not.toBeNull();
        expect(screen.queryByText('View Vegan Version')).toBeNull();
    });

    it('should show a meat icon button that links to the original recipe from the vegan recipe view', async () => {
        renderPage(routes, [...mocksMinimal, mockGetRecipeVeganCopy], [
            `${PATH.ROOT}/view/recipe/mock-recipe-one-vegan`,
        ]);

        const button = await screen.findByLabelText('View original recipe');
        expect(button).not.toBeNull();
        expect(screen.queryByText('View Original Recipe')).toBeNull();
    });

    it('should navigate to the linked recipe when the icon button is clicked', async () => {
        renderPage(routes, [...mocksMinimal, mockGetRecipeWithVeganVersion, mockGetRecipeVeganCopy], [
            `${PATH.ROOT}/view/recipe/mock-recipe-one`,
        ]);
        const user = userEvent.setup();

        await user.click(await screen.findByLabelText('View vegan version'));

        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        expect(await screen.findByLabelText('View original recipe')).not.toBeNull();
    });
});
```

- [ ] **Step 2: Run the new view-page tests to verify they fail**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.vegan.test.tsx -t "linked recipe icon toggle"
```

Expected: FAIL because the page still renders text links and no icon button.

- [ ] **Step 3: Thread a linked action prop through `IngredientsTab`**

Update `client/src/features/viewing/components/IngredientsTab.tsx`:

```tsx
interface LinkedRecipeAction {
    to: string;
    ariaLabel: string;
    tooltip: string;
    icon: React.ReactNode;
}

interface Props {
    recipe: CompletedRecipeView;
    linkedRecipeAction?: LinkedRecipeAction;
}

export function IngredientsTab(props: Props) {
    const { recipe, linkedRecipeAction } = props;
    // ...existing code...
    return (
        <IngredientsTabLayout
            // ...existing props...
            IngredientList={
                <IngredientList
                    subsections={recipe.ingredientSubsections}
                    origServings={recipe.numServings}
                    currentServings={currentServings}
                    showWakeLockBtn
                    linkedRecipeAction={linkedRecipeAction}
                />
            }
            // ...existing props...
        />
    );
}
```

- [ ] **Step 4: Render the linked-recipe icon button in `IngredientList`**

Update `client/src/features/viewing/components/IngredientList.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { TbLock, TbLockOpen2 } from 'react-icons/tb';
import { IconButton, Tooltip } from '@chakra-ui/react';

interface LinkedRecipeAction {
    to: string;
    ariaLabel: string;
    tooltip: string;
    icon: React.ReactNode;
}

export interface IngredientListProps extends BoxProps {
    subsections: IngredientSubsectionView[];
    currentServings: number;
    origServings: number;
    showWakeLockBtn?: boolean;
    linkedRecipeAction?: LinkedRecipeAction;
}

export function IngredientList(props: IngredientListProps) {
    const { linkedRecipeAction, subsections, currentServings, origServings, showWakeLockBtn, ...rest } = props;
    // ...existing code...
    return (
        <Box mb='2em' {...rest}>
            <Flex pb='10px'>
                <Text fontSize='2xl'>{modifiedSubsections[0].name ?? 'Ingredients'}</Text>
                <Spacer />
                {linkedRecipeAction ? (
                    <Tooltip label={linkedRecipeAction.tooltip} openDelay={500}>
                        <IconButton
                            as={Link}
                            to={linkedRecipeAction.to}
                            aria-label={linkedRecipeAction.ariaLabel}
                            icon={linkedRecipeAction.icon}
                            mr='2'
                        />
                    </Tooltip>
                ) : undefined}
                {showWakeLockBtn ? (
                    <Tooltip
                        label={isAwake ? 'Allow screen to sleep' : 'Keep screen awake'}
                        openDelay={500}
                    >
                        <IconButton
                            aria-label={isAwake ? 'Allow screen to sleep' : 'Keep screen awake'}
                            icon={isAwake ? <TbLockOpen2 /> : <TbLock />}
                            onClick={toggleWakeLock}
                        />
                    </Tooltip>
                ) : undefined}
            </Flex>
            <VStack spacing='24px' align='left'>
                {subsectionsList}
            </VStack>
        </Box>
    );
}
```

- [ ] **Step 5: Remove title-area links and derive the linked action in `ViewRecipe.tsx`**

Update `client/src/pages/ViewRecipe.tsx`:

```tsx
import { PiPlant } from 'react-icons/pi';
import { TbMeat } from 'react-icons/tb';
import { Container, Grid, GridItem } from '@chakra-ui/react';

export function ViewRecipe() {
    // ...existing query/loading/error code...
    const linkedRecipeAction = data.recipeOne.originalRecipe
        ? {
              to: `${PATH.ROOT}/view/recipe/${data.recipeOne.originalRecipe.titleIdentifier}`,
              ariaLabel: 'View original recipe',
              tooltip: 'View original recipe',
              icon: <TbMeat />,
          }
        : data.recipeOne.veganVersion
          ? {
                to: `${PATH.ROOT}/view/recipe/${data.recipeOne.veganVersion.titleIdentifier}`,
                ariaLabel: 'View vegan version',
                tooltip: 'View vegan version',
                icon: <PiPlant />,
            }
          : undefined;

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid /* existing grid props */>
                <GridItem boxShadow='lg' p='6' area='title'>
                    <Title title={titleNormed} />
                </GridItem>
                {/* existing image and layout items */}
                <GridItem area='ingredients' boxShadow='lg' p='6'>
                    <IngredientsTab recipe={data.recipeOne} linkedRecipeAction={linkedRecipeAction} />
                </GridItem>
                {/* existing instructions item */}
            </Grid>
        </Container>
    );
}
```

- [ ] **Step 6: Run the linked-toggle tests to verify they pass**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.vegan.test.tsx -t "linked recipe icon toggle"
```

Expected: PASS.

- [ ] **Step 7: Commit the view-page toggle work**

```bash
git add client/src/pages/ViewRecipe.tsx client/src/features/viewing/components/IngredientsTab.tsx client/src/features/viewing/components/IngredientList.tsx client/src/__tests__/index.vegan.test.tsx
git commit -m "feat: add linked vegan recipe toggle icons"
```

---

## Task 5: Add shared edit-page action row and reusable confirmation modal

**Files:**
- Create: `client/src/features/editing/components/RecipeActionButtons.tsx`
- Modify: `client/src/features/editing/components/SubmitButton.tsx`
- Modify: `client/src/features/editing/components/EditableRecipe.tsx`
- Modify: `client/src/features/editing/components/ConfirmArchiveModal.tsx`
- Modify: `client/src/features/editing/index.tsx`
- Test: `client/src/__tests__/index.vegan.test.tsx`

### Context

`EditableRecipe` currently renders a single fixed `SubmitButton`. The new archive/delete behavior needs a second action beside it plus a configurable confirmation modal. The existing `ConfirmArchiveModal` already matches the preferred Mantine styling, so reuse that styling rather than building a new visual pattern.

- [ ] **Step 1: Write the failing edit-page action visibility tests**

Add this describe block to `client/src/__tests__/index.vegan.test.tsx`:

```tsx
describe('EditRecipe — archive and delete actions', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show an Archive button for an original recipe', async () => {
        renderPage(routes, [...mocksMinimal, mockGetRecipeWithVeganVersion, mockGetRecipeTwo, mockGetRecipeThree, mockGetRecipes], [PATH.ROOT]);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(await screen.findByRole('button', { name: 'Archive recipe' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Delete vegan version' })).toBeNull();
    });

    it('should show a Delete vegan version button for a vegan copy', async () => {
        const { GET_RECIPE } = await import('@recipe/graphql/queries/recipe');
        const mockGetVeganCopyAtRecipeOne = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: {
                data: { __typename: 'Query', recipeOne: mockRecipeVeganCopy },
            },
        };
        renderPage(routes, [...mocksMinimal, mockGetVeganCopyAtRecipeOne, mockGetRecipeTwo, mockGetRecipeThree, mockGetRecipes], [PATH.ROOT]);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(await screen.findByRole('button', { name: 'Delete vegan version' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Archive recipe' })).toBeNull();
    });

    it('should open the confirmation modal with archive copy when archiving an original recipe', async () => {
        renderPage(routes, [...mocksMinimal, mockGetRecipeWithVeganVersion, mockGetRecipeTwo, mockGetRecipeThree, mockGetRecipes], [PATH.ROOT]);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(await screen.findByRole('button', { name: 'Archive recipe' }));

        expect(await screen.findByText('Archive Recipe')).not.toBeNull();
        expect(screen.getByText(/linked vegan version is archived too/i)).not.toBeNull();
    });

    it('should open the confirmation modal with delete copy when deleting a vegan version', async () => {
        const { GET_RECIPE } = await import('@recipe/graphql/queries/recipe');
        const mockGetVeganCopyAtRecipeOne = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: {
                data: { __typename: 'Query', recipeOne: mockRecipeVeganCopy },
            },
        };
        renderPage(routes, [...mocksMinimal, mockGetVeganCopyAtRecipeOne, mockGetRecipeTwo, mockGetRecipeThree, mockGetRecipes], [PATH.ROOT]);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(await screen.findByRole('button', { name: 'Delete vegan version' }));

        expect(await screen.findByText('Delete Vegan Version')).not.toBeNull();
        expect(screen.getByText(/permanently deletes the vegan copy/i)).not.toBeNull();
    });
});
```

- [ ] **Step 2: Run the action visibility tests to verify they fail**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.vegan.test.tsx -t "archive and delete actions"
```

Expected: FAIL because only the save button exists today.

- [ ] **Step 3: Create a shared fixed action-row component**

Create `client/src/features/editing/components/RecipeActionButtons.tsx`:

```tsx
import { Box, Button, Center, HStack } from '@chakra-ui/react';

import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';

interface PrimaryAction {
    submitText: string;
    loadingText?: string;
    disabled?: boolean;
    loading?: boolean;
    handleSubmit: (recipe: CreateOneRecipeCreateInput) => void;
    isLoggedIn: boolean;
}

interface SecondaryAction {
    label: string;
    ariaLabel: string;
    onClick: () => void;
    disabled?: boolean;
}

interface Props {
    primary: PrimaryAction;
    secondary?: SecondaryAction;
}
```

Use the current validation and recipe-building logic from `SubmitButton` unchanged. Keep `SubmitButton` as the validated save button component, and compose it next to a second `Button variant='danger'` inside a shared fixed `HStack`.

The render should follow this shape:

```tsx
export function RecipeActionButtons({ primary, secondary }: Props) {
    return (
        <Center>
            <Box position='fixed' bottom='4' pb='3'>
                <HStack spacing='3'>
                    {secondary ? (
                        <Button
                            size='lg'
                            variant='danger'
                            borderRadius='full'
                            aria-label={secondary.ariaLabel}
                            onClick={secondary.onClick}
                            isDisabled={secondary.disabled}
                        >
                            {secondary.label}
                        </Button>
                    ) : null}
                    <SubmitButton {...primary} />
                </HStack>
            </Box>
        </Center>
    );
}
```

- [ ] **Step 4: Make `SubmitButton` render only the save button**

Update `client/src/features/editing/components/SubmitButton.tsx` so it returns just the save `Button` and no longer wraps itself in fixed `Center`/`Box`:

```tsx
    return (
        <Button
            size='lg'
            borderRadius='full'
            aria-label='Save recipe'
            border='1px'
            borderColor='gray.200'
            onClick={onSubmit}
            loadingText={loadingText}
            isDisabled={disabled}
            isLoading={loading}
        >
            {submitText}
        </Button>
    );
```

- [ ] **Step 5: Generalize `ConfirmArchiveModal` into a configurable confirm modal**

Update `client/src/features/editing/components/ConfirmArchiveModal.tsx` to accept content props instead of being archive-only:

```tsx
interface Props {
    show: boolean;
    setShow: (show: boolean) => void;
    title: string;
    body: string;
    confirmLabel: string;
    confirmAriaLabel: string;
    onConfirm: () => void;
}

export function ConfirmArchiveModal(props: Props) {
    const { show, setShow, title, body, confirmLabel, confirmAriaLabel, onConfirm } = props;
    return (
        <Modal opened={show} onClose={() => setShow(false)} title={title}>
            <Text mb='md'>{body}</Text>
            <Group justify='flex-end'>
                <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setShow(false)}
                    aria-label='Cancel destructive action'
                >
                    Cancel
                </Button>
                <Button
                    size='sm'
                    variant='danger'
                    onClick={() => {
                        setShow(false);
                        onConfirm();
                    }}
                    aria-label={confirmAriaLabel}
                >
                    {confirmLabel}
                </Button>
            </Group>
        </Modal>
    );
}
```

This change will require updating `RecipeCardsContainer` in Task 7 because the old archive modal call site still uses mutation wiring inside the component.

- [ ] **Step 6: Update `EditableRecipe` to accept a secondary action and use the shared action row**

In `client/src/features/editing/components/EditableRecipe.tsx`, change the button-area section to use `RecipeActionButtons`:

```tsx
interface SecondaryButtonProps {
    label: string;
    ariaLabel: string;
    onClick: () => void;
    disabled?: boolean;
}

interface Props {
    // existing props...
    secondaryButtonProps?: SecondaryButtonProps;
}

<GridItem padding='6' area='button'>
    <RecipeActionButtons
        primary={{
            ...submitButtonProps,
            handleSubmit: handleSubmitMutation,
            isLoggedIn: isVerified,
        }}
        secondary={secondaryButtonProps}
    />
</GridItem>
```

- [ ] **Step 7: Export the new action row from the editing feature barrel**

Update `client/src/features/editing/index.tsx`:

```ts
export { updateRecipeCache } from './utils/update';
export { EditableRecipe } from './components/EditableRecipe';
export { ConfirmArchiveModal } from './components/ConfirmArchiveModal';
export { RecipeActionButtons } from './components/RecipeActionButtons';
export { CreateVeganVersionCheckbox } from './components/CreateVeganVersionCheckbox';
```

- [ ] **Step 8: Run the action visibility tests to verify they pass**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.vegan.test.tsx -t "archive and delete actions"
```

Expected: PASS.

- [ ] **Step 9: Commit the shared edit action UI work**

```bash
git add client/src/features/editing/components/RecipeActionButtons.tsx client/src/features/editing/components/SubmitButton.tsx client/src/features/editing/components/EditableRecipe.tsx client/src/features/editing/components/ConfirmArchiveModal.tsx client/src/features/editing/index.tsx client/src/__tests__/index.vegan.test.tsx
git commit -m "feat: add reusable recipe action buttons"
```

---

## Task 6: Implement edit-page archive/delete flows and shared recipe cache updates

**Files:**
- Modify: `client/src/pages/EditRecipe.tsx:1-275`
- Modify: `client/src/features/editing/utils/update.ts:1-43`
- Modify: `client/src/graphql/mutations/recipe.ts:1-43`
- Modify: `client/src/graphql/mutations/__mocks__/recipe.ts:1018-1102`
- Modify: `client/src/graphql/queries/__mocks__/recipe.ts:155-179`
- Test: `client/src/__tests__/index.vegan.test.tsx`

### Context

`EditRecipe.tsx` already has save mutation wiring and redirect logic. This task adds:

- destructive action button config
- confirm modal state
- archive mutation for originals
- delete mutation for vegan versions
- redirect to home after success
- cache updates for home-page list/count and linked recipe references

This is the main place where cache correctness matters. `recipeMany` and `recipeCount` use `keyArgs: []`, so broad `cache.modify` helpers are the right fit.

- [ ] **Step 1: Write the failing integration tests for confirm + redirect + cache behavior**

Append these tests to `client/src/__tests__/index.vegan.test.tsx`:

```tsx
describe('EditRecipe — archive and delete mutations', () => {
    afterEach(() => {
        cleanup();
    });

    it('should archive an original recipe, redirect home, and remove it from the home page without refresh', async () => {
        const { ARCHIVE_RECIPE } = await import('@recipe/graphql/mutations/recipe');
        const mockArchiveLinkedOriginal = {
            request: {
                query: ARCHIVE_RECIPE,
                variables: { id: mockRecipeWithVeganVersion._id },
            },
            result: {
                data: {
                    __typename: 'Mutation',
                    recipeArchiveById: {
                        __typename: 'RemoveByIdRecipePayload',
                        recordId: mockRecipeWithVeganVersion._id,
                    },
                },
            },
        };

        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeWithVeganVersion,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
                mockArchiveLinkedOriginal,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(await screen.findByRole('button', { name: 'Archive recipe' }));
        await user.click(await screen.findByLabelText('Confirm archive action'));

        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByLabelText('View Mock Recipe')).toBeNull();
    });

    it('should delete a vegan version, redirect home, and remove vegan-version state from the original recipe without refresh', async () => {
        const { GET_RECIPE } = await import('@recipe/graphql/queries/recipe');
        const { DELETE_RECIPE } = await import('@recipe/graphql/mutations/recipe');
        const mockGetVeganCopyAtRecipeOne = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: {
                data: { __typename: 'Query', recipeOne: mockRecipeVeganCopy },
            },
        };
        const mockDeleteVeganVersion = {
            request: {
                query: DELETE_RECIPE,
                variables: { id: mockRecipeVeganCopy._id },
            },
            result: {
                data: {
                    __typename: 'Mutation',
                    recipeRemoveById: {
                        __typename: 'RemoveByIdRecipePayload',
                        recordId: mockRecipeVeganCopy._id,
                    },
                },
            },
        };

        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetVeganCopyAtRecipeOne,
                mockGetRecipeOne,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
                mockDeleteVeganVersion,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(await screen.findByRole('button', { name: 'Delete vegan version' }));
        await user.click(await screen.findByLabelText('Confirm delete vegan version action'));

        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByLabelText('View Mock Recipe')).not.toBeNull();

        await user.click(screen.getByLabelText('View Mock Recipe'));
        await waitFor(() => {
            expect(screen.queryByLabelText('View vegan version')).toBeNull();
        });
    });
});
```

Use distinct-ID mocks for the vegan-delete path if the shared `mockRecipeIdTwo` collision causes cache corruption. If needed, add `mockRecipeWithVeganVersionDistinct` and `mockRecipeVeganCopyDistinct` to `client/src/graphql/queries/__mocks__/recipe.ts` and use those new fixtures in this test block.

- [ ] **Step 2: Run the new mutation tests to verify they fail**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.vegan.test.tsx -t "archive and delete mutations"
```

Expected: FAIL because the edit page does not yet wire archive/delete actions.

- [ ] **Step 3: Add a client `DELETE_RECIPE` mutation document**

Update `client/src/graphql/mutations/recipe.ts`:

```ts
export const DELETE_RECIPE = gql(`
    mutation DeleteRecipe($id: MongoID!) {
        recipeRemoveById(_id: $id) {
            recordId
        }
    }
`);
```

- [ ] **Step 4: Add shared cache helpers for archive/delete linked recipe updates**

Extend `client/src/features/editing/utils/update.ts` with helpers instead of scattering `cache.modify` blocks in `EditRecipe.tsx`:

```ts
export function removeRecipeFromCache(
    cache: ApolloCache<InMemoryCache>,
    recipeId: string,
    options?: { originalRecipeId?: string; linkedRecipeId?: string }
) {
    cache.evict({ id: `Recipe:${recipeId}` });
    cache.modify({
        fields: {
            recipeMany(existing: Reference[] = [], { readField }) {
                return existing.filter((ref) => readField('_id', ref) !== recipeId);
            },
            recipeCount(count = 0) {
                return Math.max(0, count - 1);
            },
        },
    });

    if (options?.originalRecipeId) {
        cache.modify({
            id: `Recipe:${options.originalRecipeId}`,
            fields: {
                veganVersion() {
                    return null;
                },
                calculatedTags(existing: string[] = []) {
                    return existing.filter((tag) => tag !== 'vegan version available');
                },
            },
        });
    }

    if (options?.linkedRecipeId) {
        cache.modify({
            id: `Recipe:${options.linkedRecipeId}`,
            fields: {
                archived() {
                    return true;
                },
            },
        });
    }
}

export function archiveRecipeInCache(
    cache: ApolloCache<InMemoryCache>,
    recipe: { _id: string; veganVersion?: { _id: string } | null }
) {
    removeRecipeFromCache(cache, recipe._id, { linkedRecipeId: recipe.veganVersion?._id });
    cache.modify({
        id: `Recipe:${recipe._id}`,
        fields: {
            archived() {
                return true;
            },
        },
    });
}
```

Use `ReservedTags.VeganVersionAvailable` if importing the enum is convenient; otherwise keep the string consistent with existing code.

- [ ] **Step 5: Wire archive/delete mutations and confirm modal into `EditRecipe.tsx`**

Update `client/src/pages/EditRecipe.tsx` with:

```tsx
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';

import { DELETE_RECIPE, UPDATE_RECIPE, ARCHIVE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { ConfirmArchiveModal, EditableRecipe } from '@recipe/features/editing';
import { archiveRecipeInCache, removeRecipeFromCache, updateRecipeCache } from '@recipe/features/editing';
```

Add local state:

```tsx
    const [showConfirm, setShowConfirm] = useState(false);
```

Add mutations:

```tsx
    const [archiveRecipe, { loading: archiveLoading }] = useMutation(ARCHIVE_RECIPE, {
        onError(error) {
            errorToast({ title: 'Error archiving recipe', description: error.message, position: 'top' });
        },
        update(cache) {
            if (!data?.recipeOne) {
                return;
            }
            archiveRecipeInCache(cache, data.recipeOne);
        },
    });

    const [deleteRecipe, { loading: deleteLoading }] = useMutation(DELETE_RECIPE, {
        onError(error) {
            errorToast({ title: 'Error deleting vegan version', description: error.message, position: 'top' });
        },
        update(cache) {
            if (!data?.recipeOne) {
                return;
            }
            removeRecipeFromCache(cache, data.recipeOne._id, {
                originalRecipeId: data.recipeOne.originalRecipe?._id,
            });
        },
    });
```

Add destructive action handler:

```tsx
    const handleConfirmDestructiveAction = async () => {
        if (!data?.recipeOne) {
            return;
        }

        if (data.recipeOne.originalRecipe) {
            await deleteRecipe({ variables: { id: data.recipeOne._id } });
            successToast({
                title: 'Vegan version deleted',
                description: 'Redirecting you to the home page',
                position: 'top',
            });
        } else {
            await archiveRecipe({ variables: { id: data.recipeOne._id } });
            successToast({
                title: 'Recipe archived',
                description: 'Redirecting you to the home page',
                position: 'top',
            });
        }

        setTimeout(() => navigate(PATH.ROOT), DELAY_SHORT);
    };
```

Pass secondary button props into `EditableRecipe`:

```tsx
        <EditableRecipe
            // existing props...
            secondaryButtonProps={{
                label: data.recipeOne.originalRecipe ? 'Delete vegan version' : 'Archive',
                ariaLabel: data.recipeOne.originalRecipe ? 'Delete vegan version' : 'Archive recipe',
                onClick: () => setShowConfirm(true),
                disabled: archiveLoading || deleteLoading,
            }}
        />
```

Render the modal below the page content:

```tsx
        <>
            <EditableRecipe ... />
            <ConfirmArchiveModal
                show={showConfirm}
                setShow={setShowConfirm}
                title={data.recipeOne.originalRecipe ? 'Delete Vegan Version' : 'Archive Recipe'}
                body={
                    data.recipeOne.originalRecipe
                        ? 'Are you sure you want to permanently delete this vegan version? This removes the link from the original recipe.'
                        : data.recipeOne.veganVersion
                          ? 'Are you sure you want to archive this recipe? You can restore it later, and its linked vegan version is archived too.'
                          : 'Are you sure you want to archive this recipe? You can restore it later.'
                }
                confirmLabel={data.recipeOne.originalRecipe ? 'Delete vegan version' : 'Archive'}
                confirmAriaLabel={
                    data.recipeOne.originalRecipe
                        ? 'Confirm delete vegan version action'
                        : 'Confirm archive action'
                }
                onConfirm={handleConfirmDestructiveAction}
            />
        </>
```

Handle errors by catching around the mutation calls if you want to suppress the success redirect when a mutation rejects.

- [ ] **Step 6: Add the required client mocks for archive/delete tests**

In `client/src/graphql/mutations/__mocks__/recipe.ts`, add:

```ts
import { DELETE_RECIPE } from '@recipe/graphql/mutations/recipe';

export const mockDeleteRecipeTwo = {
    request: {
        query: DELETE_RECIPE,
        variables: { id: recipeTwoVars.id },
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeRemoveById: {
                __typename: 'RemoveByIdRecipePayload',
                recordId: recipeTwoVars.id,
            },
        },
    },
};
```

If needed, add a `mockArchiveRecipeWithVeganVersion` fixture that uses `mockRecipeWithVeganVersion._id` so the new tests do not depend on unrelated recipe mocks.

- [ ] **Step 7: Add distinct-ID query mocks for archive/delete tests**

In `client/src/graphql/queries/__mocks__/recipe.ts`, create distinct-ID copies only if the new tests are unstable with shared IDs:

```ts
export const mockRecipeWithVeganVersionDistinct: CompletedRecipeView = {
    ...mockRecipeWithVeganVersion,
    _id: 'mock-recipe-original-distinct',
    veganVersion: {
        __typename: 'Recipe',
        _id: 'mock-recipe-vegan-distinct',
        title: mockTitleOne,
        titleIdentifier: 'mock-recipe-one-vegan-distinct',
    },
};

export const mockRecipeVeganCopyDistinct: CompletedRecipeView = {
    ...mockRecipeVeganCopy,
    _id: 'mock-recipe-vegan-distinct',
    titleIdentifier: 'mock-recipe-one-vegan-distinct',
    originalRecipe: {
        __typename: 'Recipe',
        _id: 'mock-recipe-original-distinct',
        title: mockTitleOne,
        titleIdentifier: 'mock-recipe-one-distinct',
    },
};
```

- [ ] **Step 8: Run the new archive/delete mutation tests to verify they pass**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.vegan.test.tsx -t "archive and delete mutations"
```

Expected: PASS.

- [ ] **Step 9: Run the full vegan test file**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.vegan.test.tsx
```

Expected: all tests in `index.vegan.test.tsx` pass; any known pre-existing unhandled rejections remain non-failing noise.

- [ ] **Step 10: Commit the archive/delete client flow**

```bash
git add client/src/pages/EditRecipe.tsx client/src/features/editing/utils/update.ts client/src/graphql/mutations/recipe.ts client/src/graphql/mutations/__mocks__/recipe.ts client/src/graphql/queries/__mocks__/recipe.ts client/src/__tests__/index.vegan.test.tsx
git commit -m "feat: add edit page archive and vegan delete flows"
```

---

## Task 7: Keep recipe-card archive modal working with the reusable confirm component

**Files:**
- Modify: `client/src/features/viewing/components/RecipeCardsContainer.tsx:1-117`
- Modify: `client/src/features/editing/components/ConfirmArchiveModal.tsx`
- Test: `client/src/__tests__/index.archive.recipe.test.tsx`

### Context

Task 4 changes `ConfirmArchiveModal` from a self-contained archive mutation component into a presentational confirmation modal. `RecipeCardsContainer` currently depends on the old behavior, so it must be updated to preserve existing archive-card flows.

- [ ] **Step 1: Run the existing archive workflow tests to confirm the regression**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.archive.recipe.test.tsx
```

Expected: FAIL after Task 4 because `RecipeCardsContainer` still expects modal-owned mutation behavior.

- [ ] **Step 2: Move archive mutation wiring into `RecipeCardsContainer`**

Update `client/src/features/viewing/components/RecipeCardsContainer.tsx`:

```tsx
import { useMutation, useQuery } from '@apollo/client';
import { notifications } from '@mantine/notifications';

import { ARCHIVE_RECIPE } from '@recipe/graphql/mutations/recipe';
```

Add mutation setup:

```tsx
    const [archiveRecipe] = useMutation(ARCHIVE_RECIPE, {
        onError(error) {
            notifications.show({
                color: 'red',
                title: 'Archive failed',
                message: error.message,
            });
        },
        update(cache, { data }) {
            const recordId = data?.recipeArchiveById?.recordId;
            if (!recordId) {
                return;
            }
            cache.evict({ id: `Recipe:${recordId}` });
            cache.modify({
                fields: {
                    recipeMany(existing: Reference[] = [], { readField }) {
                        return existing.filter((ref) => readField('_id', ref) !== recordId);
                    },
                    recipeCount(existingCount = 0) {
                        return Math.max(0, existingCount - 1);
                    },
                },
            });
        },
    });
```

Update the modal call site:

```tsx
            <ConfirmArchiveModal
                show={show}
                setShow={setShow}
                title='Archive Recipe'
                body='Are you sure you want to archive this recipe? You can restore it later.'
                confirmLabel='Confirm'
                confirmAriaLabel='Confirm archive action'
                onConfirm={() => archiveRecipe({ variables: { id: recipeId } })}
            />
```

- [ ] **Step 3: Re-run the archive workflow tests to verify they pass**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.archive.recipe.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit the recipe-card archive modal adaptation**

```bash
git add client/src/features/viewing/components/RecipeCardsContainer.tsx client/src/features/editing/components/ConfirmArchiveModal.tsx client/src/__tests__/index.archive.recipe.test.tsx
git commit -m "refactor: share recipe confirmation modal"
```

---

## Task 8: Run full verification and clean up any test fallout

**Files:**
- Verify only; no intended code changes

### Context

The feature spans both API and client, touches existing archive workflows, and changes cache behavior. Finish with the exact project verification commands the repo expects.

- [ ] **Step 1: Run API tests**

Run:

```bash
cd api && npm test
```

Expected: PASS.

- [ ] **Step 2: Run API typecheck**

Run:

```bash
cd api && ./node_modules/.bin/tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run client vegan and archive-focused tests**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run src/__tests__/index.vegan.test.tsx src/__tests__/index.archive.recipe.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Run full client test suite**

Run:

```bash
cd client && NODE_ENV=test npx vitest --workspace=vitest.default.config.ts run
```

Expected: PASS. Known pre-existing unhandled rejections from `index.vegan.test.tsx` may still appear as non-failing errors if they remain on main.

- [ ] **Step 5: Run client lint**

Run:

```bash
cd client && npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit the verified final state**

```bash
git add api client
git commit -m "feat: add vegan recipe toggle and lifecycle actions"
```

---

## Self-Review

- Spec coverage check:
  - view-page icon toggle: Task 3
  - edit-page archive/delete button + confirm modal: Tasks 4 and 5
  - archive original archives vegan version: Tasks 1 and 2
  - unarchive original unarchives vegan version: Tasks 1 and 2
  - deleting vegan version clears original `veganVersion`: Tasks 1, 2, and 5
  - Apollo cache updates without refresh: Tasks 5 and 6
- Placeholder scan: no `TODO`, `TBD`, or implied later work remains.
- Type consistency check:
  - uses existing `recipeArchiveById`, `recipeUnarchiveById`, and exposed `recipeRemoveById`
  - client mutation name `DELETE_RECIPE` maps to `recipeRemoveById`
  - linked action prop names are consistent across `ViewRecipe` → `IngredientsTab` → `IngredientList`
