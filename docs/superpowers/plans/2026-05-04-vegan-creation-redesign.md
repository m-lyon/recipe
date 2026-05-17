# Vegan Creation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `recipeMakeVegan` auto-clone flow with a user-editable vegan creation flow: user checks a checkbox on EditRecipe, saves, is navigated to a dedicated `/create/recipe/vegan/:originalTitleIdentifier` page pre-populated with the original's data, edits the recipe to be fully vegan, submits, and the two recipes are linked bidirectionally.

**Architecture:** Remove `recipeMakeVegan` mutation entirely; add `recipeLinkVeganVersion` mutation to API; add server-side vegan validation to the `recipeCreateOne` pre-save hook; create a new `CreateVeganRecipe` client page that prefills stores from the original, calls `recipeCreateOne` with `originalRecipe` set, then `recipeLinkVeganVersion`.

**Tech Stack:** Express 4 + Apollo Server 4 + graphql-compose + Mongoose 7 (API); React 18 + TypeScript + Apollo Client 3 + Zustand 5 + Mantine 8 (client); Mocha/Chai (API tests); Vitest + @testing-library/react (client tests).

---

## File Map

### API (modify only)
- `api/src/models/Recipe.ts` — add vegan validation to pre-save hook
- `api/src/schema/Recipe.ts` — remove `recipeMakeVegan`, add `recipeLinkVeganVersion`
- `api/src/schema/index.ts` — remove `recipeMakeVegan` from `isAuthenticatedMutations`, add `recipeLinkVeganVersion`
- `api/test/graphql/Recipe.test.ts` — add tests for `recipeLinkVeganVersion` and vegan validation on create

### Client (modify/create)
- `client/src/graphql/mutations/recipe.ts` — remove `MAKE_VEGAN_RECIPE`, add `LINK_VEGAN_RECIPE`
- `client/src/graphql/__mocks__/recipe.ts` — add mock for `LINK_VEGAN_RECIPE`
- `client/src/pages/EditRecipe.tsx` — update save flow: no `makeVeganRecipe` call; navigate to vegan create page or existing vegan
- `client/src/features/editing/components/EditableInstructionsTab.tsx` — update checkbox visibility condition
- `client/src/features/editing/components/EditableRecipe.tsx` — update props: replace `isVeganCopy` with `veganVersion` and `originalRecipe`
- `client/src/pages/CreateVeganRecipe.tsx` — new page
- `client/src/routes.tsx` — add route for `/create/recipe/vegan/:originalTitleIdentifier`
- `client/src/__tests__/index.editrecipe.test.tsx` — update/add tests for new flow
- `client/src/pages/__tests__/CreateVeganRecipe.test.tsx` — new page tests

---

## Task 1: Add `recipeLinkVeganVersion` to API and remove `recipeMakeVegan`

**Files:**
- Modify: `api/src/schema/Recipe.ts`
- Modify: `api/src/schema/index.ts`

- [ ] **Step 1: Remove `recipeMakeVegan` from `api/src/schema/Recipe.ts`**

  Delete lines 303–368 (the `recipeMakeVegan` resolver and its `wrapResolve`). The file ends after `recipeArchiveById`/`recipeUnarchiveById`.

  The `RecipeMutation` export object at the end of the file should no longer contain `recipeMakeVegan`.

- [ ] **Step 2: Add `recipeLinkVeganVersion` resolver to `api/src/schema/Recipe.ts`**

  Add the following before the closing `};` of `export const RecipeMutation`:

  ```typescript
  recipeLinkVeganVersion: schemaComposer
      .createResolver({
          name: 'recipeLinkVeganVersion',
          type: 'Boolean',
          args: { originalId: 'MongoID!', veganId: 'MongoID!' },
          resolve: async ({ args }) => {
              const { originalId, veganId } = args;
              await Recipe.findByIdAndUpdate(originalId, { veganVersion: veganId });
              await Recipe.findByIdAndUpdate(veganId, { originalRecipe: originalId });
              // Recompute calculatedTags on original (adds VeganOptionAvailable)
              const updatedOriginal = await Recipe.findById(originalId);
              if (updatedOriginal) await updatedOriginal.save();
              return true;
          },
      })
      .wrapResolve((next) => async (rp) => {
          const { originalId, veganId } = rp.args;
          const [original, vegan] = await Promise.all([
              Recipe.findById(originalId),
              Recipe.findById(veganId),
          ]);
          if (!original) throw new Error('Original recipe not found');
          if (!vegan) throw new Error('Vegan recipe not found');
          const userId = String(rp.context.getUser());
          if (String(original.owner) !== userId)
              throw new Error('Not authorized to modify original recipe');
          if (String(vegan.owner) !== userId)
              throw new Error('Not authorized to modify vegan recipe');
          if (original.veganVersion)
              throw new Error('Original recipe already has a vegan version');
          if (vegan.originalRecipe)
              throw new Error('Vegan recipe already has an original recipe');
          return next(rp);
      }),
  ```

- [ ] **Step 3: Update `api/src/schema/index.ts`**

  In the `isAuthenticatedMutations` block, replace:
  ```typescript
  recipeMakeVegan: RecipeMutation.recipeMakeVegan,
  ```
  with:
  ```typescript
  recipeLinkVeganVersion: RecipeMutation.recipeLinkVeganVersion,
  ```

- [ ] **Step 4: Type-check the API**

  Run:
  ```bash
  cd api && ./node_modules/.bin/tsc --noEmit
  ```
  Expected: no errors.

---

## Task 2: Add server-side vegan validation to `recipeCreateOne` pre-save hook

**Files:**
- Modify: `api/src/models/Recipe.ts`

- [ ] **Step 1: Add vegan assertion inside the pre-save hook**

  In `api/src/models/Recipe.ts`, after the line `this.calculatedTags = calculatedTags;` (line ~303), add:

  ```typescript
  if (this.originalRecipe != null && !calculatedTags.includes(ReservedIngredientTags.Vegan)) {
      throw new Error('Vegan recipe must have all vegan ingredients');
  }
  ```

  The full end of the pre-save hook then reads:
  ```typescript
      if (this.veganVersion != null) {
          calculatedTags.push(ReservedRecipeTags.VeganOptionAvailable);
      }
      this.calculatedTags = calculatedTags;
      if (this.originalRecipe != null && !calculatedTags.includes(ReservedIngredientTags.Vegan)) {
          throw new Error('Vegan recipe must have all vegan ingredients');
      }
  });
  ```

- [ ] **Step 2: Type-check the API**

  Run:
  ```bash
  cd api && ./node_modules/.bin/tsc --noEmit
  ```
  Expected: no errors.

---

## Task 3: Write and run API tests

**Files:**
- Modify: `api/test/graphql/Recipe.test.ts`

- [ ] **Step 1: Add `recipeLinkVeganVersion` tests**

  Find the end of the test file and add a new describe block. Use the same helper pattern as existing tests (`this` context object, `apolloServer.executeOperation`, `assert` from chai).

  Look at how `recipeCreateOne` tests create recipes to understand data setup — specifically the `createRecipe` helper at the top of the file.

  First read lines 1–90 of the test file to understand helpers:
  ```bash
  # The test file defines helpers like:
  # - createRecipe(this, user, record) → runs executeOperation with CREATE_RECIPE mutation
  # - parseCreatedRecipe(response) → extracts record from response
  ```

  Add after the last `describe` block:

  ```typescript
  describe('recipeLinkVeganVersion', () => {
      const LINK_VEGAN = `
          mutation LinkVegan($originalId: MongoID!, $veganId: MongoID!) {
              recipeLinkVeganVersion(originalId: $originalId, veganId: $veganId)
          }
      `;

      async function linkVegan(
          ctx: Mocha.Context,
          user: UserType,
          originalId: string,
          veganId: string
      ) {
          return ctx.apolloServer.executeOperation(
              { query: LINK_VEGAN, variables: { originalId, veganId } },
              { contextValue: { getUser: () => user._id, isAuthenticated: () => true } }
          );
      }

      it('should link original and vegan recipes bidirectionally', async function () {
          const user = await User.findOne({ username: 'testuser1' });
          const ingredient = await Ingredient.findOne({ name: 'tomato' });
          const unit = await Unit.findOne({ shortSingular: 'g' });
          const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
          const tag = await Tag.findOne({ value: 'dinner' });
          const baseRecord = {
              title: 'Tomato Soup',
              ingredientSubsections: [{ ingredients: [{ ingredient: ingredient._id, quantity: '300', unit: unit._id, prepMethod: prepMethod._id }] }],
              instructionSubsections: [{ name: 'Main', instructions: ['Heat and serve.'] }],
              numServings: 2,
              tags: [tag._id],
              isIngredient: false,
          };
          const origResp = await createRecipe(this, user, baseRecord);
          const original = parseCreatedRecipe(origResp);
          const veganResp = await createRecipe(this, user, { ...baseRecord, title: 'Vegan Tomato Soup', originalRecipe: original._id });
          const vegan = parseCreatedRecipe(veganResp);

          const linkResp = await linkVegan(this, user, original._id, vegan._id);
          assert.equal(linkResp.body.kind, 'single');
          assert.isNull((linkResp.body as any).singleResult.errors);
          assert.isTrue((linkResp.body as any).singleResult.data.recipeLinkVeganVersion);

          const updatedOriginal = await Recipe.findById(original._id);
          const updatedVegan = await Recipe.findById(vegan._id);
          assert.equal(String(updatedOriginal.veganVersion), String(vegan._id));
          assert.equal(String(updatedVegan.originalRecipe), String(original._id));
          assert.isTrue(updatedOriginal.calculatedTags.includes('vegan version available'));
      });

      it('should NOT link if original already has a veganVersion', async function () {
          const user = await User.findOne({ username: 'testuser1' });
          const ingredient = await Ingredient.findOne({ name: 'tomato' });
          const unit = await Unit.findOne({ shortSingular: 'g' });
          const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
          const tag = await Tag.findOne({ value: 'dinner' });
          const baseRecord = {
              title: 'Tomato Bisque',
              ingredientSubsections: [{ ingredients: [{ ingredient: ingredient._id, quantity: '300', unit: unit._id, prepMethod: prepMethod._id }] }],
              instructionSubsections: [{ name: 'Main', instructions: ['Blend and serve.'] }],
              numServings: 2,
              tags: [tag._id],
              isIngredient: false,
          };
          const origResp = await createRecipe(this, user, baseRecord);
          const original = parseCreatedRecipe(origResp);
          const vegan1Resp = await createRecipe(this, user, { ...baseRecord, title: 'Vegan Tomato Bisque', originalRecipe: original._id });
          const vegan1 = parseCreatedRecipe(vegan1Resp);
          await linkVegan(this, user, original._id, vegan1._id);

          const vegan2Resp = await createRecipe(this, user, { ...baseRecord, title: 'Vegan Tomato Bisque 2', originalRecipe: original._id });
          const vegan2 = parseCreatedRecipe(vegan2Resp);
          const linkResp = await linkVegan(this, user, original._id, vegan2._id);
          const errors = (linkResp.body as any).singleResult.errors;
          assert.isDefined(errors);
          assert.include(errors[0].message, 'already has a vegan version');
      });

      it('should NOT link if caller does not own both recipes', async function () {
          const user1 = await User.findOne({ username: 'testuser1' });
          const user2 = await User.findOne({ username: 'testuser2' });
          const ingredient = await Ingredient.findOne({ name: 'tomato' });
          const unit = await Unit.findOne({ shortSingular: 'g' });
          const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
          const tag = await Tag.findOne({ value: 'dinner' });
          const baseRecord = {
              title: 'Tomato Broth',
              ingredientSubsections: [{ ingredients: [{ ingredient: ingredient._id, quantity: '300', unit: unit._id, prepMethod: prepMethod._id }] }],
              instructionSubsections: [{ name: 'Main', instructions: ['Simmer.'] }],
              numServings: 2,
              tags: [tag._id],
              isIngredient: false,
          };
          const origResp = await createRecipe(this, user1, baseRecord);
          const original = parseCreatedRecipe(origResp);
          const veganResp = await createRecipe(this, user2, { ...baseRecord, title: 'Vegan Tomato Broth', originalRecipe: original._id });
          const vegan = parseCreatedRecipe(veganResp);

          const linkResp = await linkVegan(this, user1, original._id, vegan._id);
          const errors = (linkResp.body as any).singleResult.errors;
          assert.isDefined(errors);
          assert.include(errors[0].message, 'Not authorized');
      });
  });

  describe('recipeCreateOne vegan validation', () => {
      it('should NOT create a recipe with originalRecipe set if not all ingredients are vegan', async function () {
          const user = await User.findOne({ username: 'testuser1' });
          const nonVeganIngredient = await Ingredient.findOne({ name: 'chicken' });
          const unit = await Unit.findOne({ shortSingular: 'g' });
          const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
          const tag = await Tag.findOne({ value: 'dinner' });
          const baseRecord = {
              title: 'Chicken Original',
              ingredientSubsections: [{ ingredients: [{ ingredient: nonVeganIngredient._id, quantity: '300', unit: unit._id, prepMethod: prepMethod._id }] }],
              instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
              numServings: 2,
              tags: [tag._id],
              isIngredient: false,
          };
          const origResp = await createRecipe(this, user, baseRecord);
          const original = parseCreatedRecipe(origResp);

          const veganResp = await createRecipe(this, user, { ...baseRecord, title: 'Vegan Chicken', originalRecipe: original._id });
          const errors = (veganResp.body as any).singleResult.errors;
          assert.isDefined(errors);
          assert.include(errors[0].message, 'Vegan recipe must have all vegan ingredients');
      });
  });
  ```

- [ ] **Step 2: Run the API tests**

  ```bash
  cd api && npm test
  ```
  Expected: all existing tests pass, new tests pass. If a test fails due to missing `testuser2`, check `api/test/` setup and add the user to the seed data.

- [ ] **Step 3: Commit**

  ```bash
  cd api && git add src/models/Recipe.ts src/schema/Recipe.ts src/schema/index.ts test/graphql/Recipe.test.ts
  git commit -m "feat(api): replace recipeMakeVegan with recipeLinkVeganVersion + vegan create validation"
  ```

---

## Task 4: Update client GraphQL mutations

**Files:**
- Modify: `client/src/graphql/mutations/recipe.ts`
- Modify: `client/src/graphql/__mocks__/recipe.ts`

- [ ] **Step 1: Replace `MAKE_VEGAN_RECIPE` with `LINK_VEGAN_RECIPE` in `client/src/graphql/mutations/recipe.ts`**

  Remove:
  ```typescript
  export const MAKE_VEGAN_RECIPE = gql(`
      mutation MakeVeganRecipe($originalId: MongoID!) {
          recipeMakeVegan(originalId: $originalId) {
              record {
                  _id
                  title
                  titleIdentifier
                  originalRecipe {
                      _id
                      title
                      titleIdentifier
                  }
              }
          }
      }
  `);
  ```

  Add in its place:
  ```typescript
  export const LINK_VEGAN_RECIPE = gql(`
      mutation LinkVeganRecipe($originalId: MongoID!, $veganId: MongoID!) {
          recipeLinkVeganVersion(originalId: $originalId, veganId: $veganId)
      }
  `);
  ```

- [ ] **Step 2: Add mock for `LINK_VEGAN_RECIPE` in `client/src/graphql/__mocks__/recipe.ts`**

  Read the existing mocks file to understand its structure, then add:
  ```typescript
  import { LINK_VEGAN_RECIPE } from '../mutations/recipe';

  export const mockLinkVeganRecipe = {
      request: { query: LINK_VEGAN_RECIPE, variables: { originalId: expect.any(String), veganId: expect.any(String) } },
      result: { data: { recipeLinkVeganVersion: true } },
  };
  ```
  (Or follow the exact pattern used in the mocks file for variable-matching.)

- [ ] **Step 3: Run codegen**

  The API must be running. In a separate terminal:
  ```bash
  cd api && npm run compile && PORT=4005 NODE_ENV=development node ./dist/src/index.js &
  ```
  Then:
  ```bash
  cd client && VITE_GRAPHQL_URL=http://localhost:4005/ npm run generate
  ```
  Expected: `client/src/__generated__/graphql.ts` regenerated with `recipeLinkVeganVersion` and without `recipeMakeVegan`.

- [ ] **Step 4: Type-check and lint the client**

  ```bash
  cd client && npm run check-types && npm run lint
  ```
  Expected: no errors.

---

## Task 5: Update `EditRecipe` save flow

**Files:**
- Modify: `client/src/pages/EditRecipe.tsx`
- Modify: `client/src/features/editing/components/EditableRecipe.tsx`
- Modify: `client/src/features/editing/components/EditableInstructionsTab.tsx`

**Context:** Currently `EditRecipe` calls `makeVeganRecipe` mutation after saving. The new flow is:
- If `createVeganVersion` is checked AND `data.recipeOne.veganVersion` already exists → save normally, then show a toast "Redirecting you to the existing vegan version" and navigate to `/edit/recipe/:veganTitleIdentifier`.
- If `createVeganVersion` is checked AND no vegan version exists yet → save normally, then navigate to `/create/recipe/vegan/:titleIdentifier` (the new page that handles creation).
- Checkbox should only show when `!data.recipeOne.originalRecipe && !data.recipeOne.veganVersion`.

- [ ] **Step 1: Update `EditRecipe.tsx` — remove `MAKE_VEGAN_RECIPE`, update save flow**

  Remove the import of `MAKE_VEGAN_RECIPE` and `useMutation(MAKE_VEGAN_RECIPE)`.

  Replace the `if (recipeState.createVeganVersion)` block (lines ~228–253) with:

  ```typescript
  if (recipeState.createVeganVersion) {
      recipeState.resetCreateVeganVersion();
      if (data.recipeOne.veganVersion) {
          const veganTitleIdentifier = data.recipeOne.veganVersion.titleIdentifier;
          successToast({
              title: 'Redirecting to existing vegan version',
              description: 'This recipe already has a vegan version',
              position: 'top',
          });
          return setTimeout(
              () => navigate(`${PATH.ROOT}/edit/recipe/${veganTitleIdentifier}`),
              DELAY_SHORT
          );
      }
      return setTimeout(
          () => navigate(`${PATH.ROOT}/create/recipe/vegan/${data.recipeOne.titleIdentifier}`),
          0
      );
  }
  ```

- [ ] **Step 2: Update props passed to `EditableRecipe` in `EditRecipe.tsx`**

  Change:
  ```typescript
  isVeganCopy={!!data.recipeOne.originalRecipe}
  ```
  to:
  ```typescript
  veganVersion={data.recipeOne.veganVersion ?? undefined}
  originalRecipe={data.recipeOne.originalRecipe ?? undefined}
  ```

- [ ] **Step 3: Update `EditableRecipe.tsx` props interface**

  Replace `isVeganCopy?: boolean` with:
  ```typescript
  veganVersion?: { _id: string; title: string; titleIdentifier: string };
  originalRecipe?: { _id: string; title: string; titleIdentifier: string };
  ```
  Update destructuring and pass both down to `EditableInstructionsTab` and `EditableTitle`.

  `EditableTitle` uses `isReadOnly={isVeganCopy}` — change to `isReadOnly={!!originalRecipe}`.

  Pass `showVeganCheckbox={!originalRecipe && !veganVersion}` to `EditableInstructionsTab`.

- [ ] **Step 4: Update `EditableInstructionsTab.tsx`**

  Replace:
  ```typescript
  interface Props { isVeganCopy?: boolean; }
  export function EditableInstructionsTab({ isVeganCopy }: Props) {
  ```
  with:
  ```typescript
  interface Props { showVeganCheckbox?: boolean; }
  export function EditableInstructionsTab({ showVeganCheckbox }: Props) {
  ```

  Replace:
  ```typescript
  {!isVeganCopy && (
  ```
  with:
  ```typescript
  {showVeganCheckbox && (
  ```

- [ ] **Step 5: Type-check and lint**

  ```bash
  cd client && npm run check-types && npm run lint
  ```
  Expected: no errors.

---

## Task 6: Create `CreateVeganRecipe` page

**Files:**
- Create: `client/src/pages/CreateVeganRecipe.tsx`
- Modify: `client/src/routes.tsx`

**Context:** This page:
1. Reads `:originalTitleIdentifier` from URL params.
2. Fetches the original recipe using `GET_RECIPE`.
3. On load, prefills recipe store and images store exactly as `EditRecipe.onCompleted` does (copy that logic), but does NOT set `originalRecipe` or `veganVersion` in the store.
4. On submit: calls `recipeCreateOne` with the store's current state plus `originalRecipe: original._id`. If server throws (non-vegan ingredients), shows an error toast.
5. On success: calls `LINK_VEGAN_RECIPE` with `originalId: original._id, veganId: newRecipe._id`. On success, navigates to `/edit/recipe/:newTitleIdentifier`.
6. Shows the `EditableRecipe` component with `isVeganCopy` hidden (no checkbox, no `originalRecipe` prop).

- [ ] **Step 1: Create `client/src/pages/CreateVeganRecipe.tsx`**

  ```typescript
  import { useEffect, useState } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { useShallow } from 'zustand/shallow';
  import { useMutation, useQuery } from '@apollo/client';

  import { useAddRating } from '@recipe/features/rating';
  import { useUploadImages } from '@recipe/features/images';
  import { useImagesStore, useRecipeStore } from '@recipe/stores';
  import { CREATE_RECIPE, LINK_VEGAN_RECIPE } from '@recipe/graphql/mutations/recipe';
  import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
  import { DELAY_LONG, DELAY_SHORT, PATH, GRAPHQL_URL } from '@recipe/constants';
  import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
  import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';
  import { EditableRecipe, updateRecipeCache } from '@recipe/features/editing';
  import { queryIngredientToFinished } from '@recipe/features/editing';

  export function CreateVeganRecipe() {
      const { originalTitleIdentifier } = useParams<{ originalTitleIdentifier: string }>();
      const navigate = useNavigate();
      const errorToast = useErrorToast();
      const successToast = useSuccessToast();
      const [rating, setRating] = useState<number>(0);

      const { images, setImages, resetImages } = useImagesStore(
          useShallow((state) => ({
              images: state.images,
              setImages: state.setImages,
              resetImages: state.resetImages,
          }))
      );
      const recipeState = useRecipeStore(
          useShallow((state) => ({
              setTitle: state.setTitle,
              setNumServings: state.setNumServings,
              resetIngredients: state.resetIngredients,
              setIngredientSection: state.setIngredientSection,
              addIngredientSection: state.addIngredientSection,
              resetInstructions: state.resetInstructions,
              setInstructionSection: state.setInstructionSection,
              addInstructionSection: state.addInstructionSection,
              setNotes: state.setNotes,
              setTags: state.setTags,
              setSource: state.setSource,
              setAsIngredient: state.setAsIngredient,
              setPluralTitle: state.setPluralTitle,
              resetAsIngredient: state.resetAsIngredient,
              resetRecipe: state.resetRecipe,
              resetCreateVeganVersion: state.resetCreateVeganVersion,
          }))
      );

      useEffect(() => {
          resetImages();
          recipeState.resetRecipe();
          return () => {
              resetImages();
              recipeState.resetRecipe();
          };
      }, []);

      const { data, loading, error } = useQuery(GET_RECIPE, {
          variables: { filter: { titleIdentifier: originalTitleIdentifier } },
          onCompleted: async (data) => {
              if (!data.recipeOne) return;
              const recipe = data.recipeOne;
              recipeState.setTitle(recipe.title);
              recipeState.setNumServings(recipe.numServings);
              recipeState.resetIngredients();
              recipe.ingredientSubsections.forEach((sub, index) => {
                  recipeState.setIngredientSection(
                      index,
                      sub.ingredients.map((i) => queryIngredientToFinished(i)),
                      sub.name || undefined
                  );
                  if (
                      recipe.ingredientSubsections.length > 1 ||
                      recipe.ingredientSubsections[0].name
                  ) {
                      recipeState.addIngredientSection();
                  }
              });
              recipeState.resetInstructions();
              recipe.instructionSubsections.forEach((sub, index) => {
                  recipeState.setInstructionSection(
                      index,
                      [...sub.instructions, ''],
                      sub.name || undefined
                  );
                  if (
                      recipe.instructionSubsections.length > 1 ||
                      recipe.instructionSubsections[0].name
                  ) {
                      recipeState.addInstructionSection();
                  }
              });
              recipeState.setNotes(recipe.notes ?? '');
              recipeState.setTags(
                  recipe.tags.map((tag) => ({
                      _id: tag._id,
                      value: tag.value,
                      key: crypto.randomUUID(),
                      isNew: false,
                  }))
              );
              recipeState.setSource(recipe.source ?? '');
              if (recipe.isIngredient && recipe.pluralTitle) {
                  recipeState.setAsIngredient();
                  recipeState.setPluralTitle(recipe.pluralTitle);
              } else {
                  recipeState.resetAsIngredient();
              }
              recipeState.resetCreateVeganVersion();
              if (recipe.images) {
                  try {
                      const fetchedImages = await Promise.all(
                          recipe.images.map(async (img) => {
                              const res = await fetch(`${GRAPHQL_URL}${img.origUrl}`);
                              const blob = await res.blob();
                              return new File([blob], img.origUrl, { type: blob.type });
                          })
                      );
                      setImages(fetchedImages);
                  } catch (e: unknown) {
                      let description = 'An error occurred while loading images';
                      if (e instanceof Error) description = e.message;
                      errorToast({ title: 'Error loading images', description, position: 'top' });
                  }
              }
          },
      });

      const [createRecipe, { loading: recipeLoading, data: createResponse }] = useMutation(
          CREATE_RECIPE,
          {
              update(cache, { data }) {
                  const { record } = data?.recipeCreateOne || {};
                  if (!record) return;
                  updateRecipeCache(cache, record, true);
              },
          }
      );
      const [linkVeganRecipe] = useMutation(LINK_VEGAN_RECIPE);
      const { addRating, loading: ratingLoading } = useAddRating();
      const { uploadImages, loading: uploadLoading } = useUploadImages();

      const handleSubmitMutation = async (recipe: CreateOneRecipeCreateInput) => {
          if (!data?.recipeOne) return;
          const originalId = data.recipeOne._id;

          let recipeResult: RecipeView;
          try {
              const result = await createRecipe({
                  variables: { recipe: { ...recipe, originalRecipe: originalId } },
              });
              recipeResult = result.data?.recipeCreateOne?.record;
          } catch (e) {
              let description = 'An error occurred while creating the vegan recipe';
              if (e instanceof Error) description = e.message;
              return errorToast({ title: 'Error creating vegan recipe', description, position: 'top' });
          }

          try {
              if (rating !== 0) await addRating(rating, recipeResult);
          } catch (e: unknown) {
              let description = 'An error occurred while adding the rating';
              if (e instanceof Error) description = e.message;
              errorToast({
                  title: 'Error adding rating, redirecting to home',
                  description,
                  position: 'top',
              });
              return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
          }

          try {
              if (images.length > 0) await uploadImages(images, recipeResult);
          } catch (e: unknown) {
              let description = 'An error occurred while uploading images';
              if (e instanceof Error) description = e.message;
              errorToast({
                  title: 'Error uploading images, redirecting to home',
                  description,
                  position: 'top',
              });
              return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
          }

          try {
              await linkVeganRecipe({
                  variables: { originalId, veganId: recipeResult._id },
              });
          } catch (e: unknown) {
              let description = 'An error occurred while linking the vegan version';
              if (e instanceof Error) description = e.message;
              errorToast({ title: 'Error linking vegan recipe', description, position: 'top' });
              return setTimeout(
                  () => navigate(`${PATH.ROOT}/edit/recipe/${recipeResult.titleIdentifier}`),
                  DELAY_LONG
              );
          }

          successToast({
              title: 'Vegan version created',
              description: 'Redirecting you to edit the vegan version',
              position: 'top',
          });
          setTimeout(
              () => navigate(`${PATH.ROOT}/edit/recipe/${recipeResult.titleIdentifier}`),
              DELAY_SHORT
          );
      };

      if (loading) return <div>Loading...</div>;
      if (error || !data?.recipeOne) return <div>Recipe not found</div>;

      return (
          <EditableRecipe
              rating={rating}
              addRating={setRating}
              handleSubmitMutation={handleSubmitMutation}
              originalRecipe={data.recipeOne}
              submitButtonProps={{
                  submitText: 'Submit Vegan Version',
                  loadingText:
                      recipeLoading || ratingLoading
                          ? 'Submitting Recipe...'
                          : uploadLoading
                            ? 'Uploading Images...'
                            : undefined,
                  disabled: !!createResponse,
                  loading: recipeLoading || ratingLoading || uploadLoading,
              }}
          />
      );
  }
  ```

  Note: `originalRecipe` is passed to `EditableRecipe` so the title is read-only and the vegan checkbox is hidden. `queryIngredientToFinished` — verify this is exported from `@recipe/features/editing`; if not, import directly from its source file and add to the barrel export.

- [ ] **Step 2: Add route to `client/src/routes.tsx`**

  Import `CreateVeganRecipe`:
  ```typescript
  import { CreateVeganRecipe } from './pages/CreateVeganRecipe';
  ```

  After the `<Route path='recipe' element={<CreateRecipe />} />` line, add:
  ```typescript
  <Route path='recipe/vegan/:originalTitleIdentifier' element={<CreateVeganRecipe />} />
  ```

- [ ] **Step 3: Check `queryIngredientToFinished` export**

  ```bash
  grep -rn 'queryIngredientToFinished' client/src/features/editing/index.tsx
  ```
  If not exported from the barrel, add it.

- [ ] **Step 4: Type-check and lint**

  ```bash
  cd client && npm run check-types && npm run lint
  ```
  Expected: no errors. Fix any import path issues.

---

## Task 7: Run all tests, commit, and push

- [ ] **Step 1: Run API tests**

  ```bash
  cd api && npm test
  ```
  Expected: all pass.

- [ ] **Step 2: Run client tests**

  ```bash
  cd client && npm test -- run
  ```
  Expected: all pass (except the pre-existing `EditableIngredient.browser.test.tsx` failure). Fix any test failures caused by:
  - Removed `MAKE_VEGAN_RECIPE` — update any test that imports or mocks it to use `LINK_VEGAN_RECIPE`.
  - `isVeganCopy` prop removed — update any test that passes `isVeganCopy` to `EditableRecipe` or `EditableInstructionsTab`.

- [ ] **Step 3: Lint and type-check both projects**

  ```bash
  cd api && ./node_modules/.bin/tsc --noEmit
  cd client && npm run check-types && npm run lint
  ```

- [ ] **Step 4: Commit client changes**

  ```bash
  cd client && git add src/graphql/mutations/recipe.ts src/graphql/__mocks__/recipe.ts \
      src/pages/EditRecipe.tsx src/pages/CreateVeganRecipe.tsx src/routes.tsx \
      src/features/editing/components/EditableRecipe.tsx \
      src/features/editing/components/EditableInstructionsTab.tsx \
      src/features/editing/index.tsx
  git commit -m "feat(client): replace make-vegan flow with editable vegan create page"
  ```

- [ ] **Step 5: Push and update PR**

  ```bash
  git push
  ```
  PR #85 already exists — pushing will update it automatically.
