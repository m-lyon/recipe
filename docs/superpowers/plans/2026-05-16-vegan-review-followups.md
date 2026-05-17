# Vegan Review Followups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the five post-review regressions in vegan creation, linked archive validation, admin authorization, and cache consistency without broad refactoring.

**Architecture:** Add one regression test per reported bug in the existing client and API test suites, verify each test fails for the intended reason, then apply the smallest targeted fix in the current implementation files. Keep the current feature structure intact and only adjust the specific branches, validators, and cache updates implicated by the review.

**Tech Stack:** React 18, Vitest, Apollo Client cache helpers, Express, Apollo Server, Mongoose, Mocha, Chai

---

### Task 1: Fix rename-plus-vegan-create redirect

**Files:**
- Modify: `client/src/__tests__/index.vegan.test.tsx`
- Modify: `client/src/pages/EditRecipe.tsx`
- Test: `client/src/__tests__/index.vegan.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('redirects vegan creation using the updated title identifier after a rename', async () => {
    renderPage(
        routes,
        [
            ...mocksMinimal,
            mockGetRecipeOne,
            mockUpdateRecipeOneWithRename,
            mockGetRenamedRecipe,
            mockCreateVeganPageForRenamedRecipe,
        ],
        [`${PATH.ROOT}/edit/recipe/mock-recipe-one`]
    );
    const user = userEvent.setup();

    await screen.findByDisplayValue('Mock Recipe');
    await user.clear(screen.getByLabelText('Recipe title'));
    await user.type(screen.getByLabelText('Recipe title'), 'Mock Recipe Renamed');
    await user.click(screen.getByLabelText('Create vegan version of this recipe'));
    await user.click(screen.getByLabelText('Save recipe'));

    expect(await screen.findByText('Create Vegan Recipe')).not.toBeNull();
    expect(screen.queryByText('Recipe not found')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- run client/src/__tests__/index.vegan.test.tsx`
Expected: FAIL because the redirect still uses `data.recipeOne.titleIdentifier` and loads the old slug.

- [ ] **Step 3: Write minimal implementation**

```tsx
const savedRecipe = response.recipeUpdateById?.record;

return setTimeout(() => {
    recipeState.resetCreateVeganVersion();
    navigate(`${PATH.ROOT}/create/recipe/vegan/${savedRecipe!.titleIdentifier}`);
}, DELAY_SHORT);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- run client/src/__tests__/index.vegan.test.tsx`
Expected: PASS for the new redirect regression test.

### Task 2: Restrict vegan-copy duplicate titles to their own original

**Files:**
- Modify: `api/test/graphql/Recipe.test.ts`
- Modify: `api/src/models/validation.ts`
- Test: `api/test/graphql/Recipe.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('should NOT allow a vegan copy to duplicate an unrelated recipe title', async function () {
    const user = await User.findOne({ username: 'testuser1' });
    const original = await Recipe.findOne({ title: 'Mock Recipe' });
    const unrelated = await Recipe.create({
        ...getDefaultRecipeRecord(ingredient, unit, prepMethod, tag),
        owner: user._id,
        title: 'Existing Admin Or User Title',
        titleIdentifier: 'existing-admin-or-user-title',
    });
    const veganCopy = new Recipe({
        ...getDefaultRecipeRecord(tomatoIngredient, unit, prepMethod, tag),
        owner: user._id,
        title: unrelated.title,
        titleIdentifier: 'existing-admin-or-user-title-vegan',
        originalRecipe: original._id,
    });

    await assert.isRejected(veganCopy.save(), /must be unique/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --grep "should NOT allow a vegan copy to duplicate an unrelated recipe title"`
Expected: FAIL because the current validator returns `true` for any recipe with `originalRecipe` set.

- [ ] **Step 3: Write minimal implementation**

```ts
if (this.originalRecipe != null) {
    const original = await this.model(model).findById(this.originalRecipe).select(attribute);
    if (original?.get(attribute) === value) {
        return true;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --grep "duplicate an unrelated recipe title"`
Expected: PASS, while existing "same title as original" behavior still passes.

### Task 3: Preserve archive validation for linked vegan recipes

**Files:**
- Modify: `api/test/graphql/Recipe.test.ts`
- Modify: `api/src/schema/Recipe.ts`
- Test: `api/test/graphql/Recipe.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('should NOT archive an original recipe when its linked vegan version is in use', async function () {
    const user = await User.findOne({ username: 'testuser1' });
    const original = await Recipe.findOne({ title: 'Mock Recipe' });
    const vegan = await Recipe.findOne({ originalRecipe: original._id });

    await Recipe.create({
        ...getDefaultRecipeRecord(recipeIngredient, unit, prepMethod, tag),
        owner: user._id,
        title: 'Uses Vegan Copy',
        titleIdentifier: 'uses-vegan-copy',
        ingredientSubsections: [{ name: 'Main', ingredients: [{ ingredient: vegan._id, quantity: '1' }] }],
    });

    const response = await archiveRecipe(this, user, original._id);
    assert.match(response.body.singleResult.errors?.[0].message ?? '', /cannot archive/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --grep "linked vegan version is in use"`
Expected: FAIL because only the original recipe id is validated today.

- [ ] **Step 3: Write minimal implementation**

```ts
const recipe = await Recipe.findById(rp.args._id);
await validateItemNotInRecipe(rp.args._id, 'recipe');
if (recipe?.veganVersion) {
    await validateItemNotInRecipe(recipe.veganVersion, 'recipe');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --grep "linked vegan version is in use"`
Expected: PASS for the new archive guard regression test.

### Task 4: Restore admin permission for vegan linking

**Files:**
- Modify: `api/test/graphql/Recipe.test.ts`
- Modify: `api/src/schema/Recipe.ts`
- Test: `api/test/graphql/Recipe.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('should allow an admin to link a vegan version for another users recipe', async function () {
    const admin = await User.findOne({ username: 'admin' });
    const userRecipe = await Recipe.findOne({ title: 'Mock Recipe' });
    const veganCopy = await Recipe.create({
        ...veganRecord,
        owner: admin._id,
        originalRecipe: undefined,
    });

    const response = await linkVeganVersion(this, admin, userRecipe._id, veganCopy._id);
    assert.isUndefined(response.body.singleResult.errors);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --grep "allow an admin to link a vegan version"`
Expected: FAIL with `Not authorized to modify original recipe`.

- [ ] **Step 3: Write minimal implementation**

```ts
const user = rp.context.getUser();
const isAdmin = user.role === 'admin';
const userId = String(user._id);

if (!isAdmin && String(original.owner) !== userId) {
    throw new Error('Not authorized to modify original recipe');
}
if (!isAdmin && String(vegan.owner) !== userId) {
    throw new Error('Not authorized to modify vegan recipe');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --grep "allow an admin to link a vegan version"`
Expected: PASS for the admin authorization regression test.

### Task 5: Keep home-page recipeCount stable for vegan copies

**Files:**
- Modify: `client/src/__tests__/editing.update.test.ts`
- Modify: `client/src/features/editing/utils/update.ts`
- Test: `client/src/__tests__/editing.update.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('does not increment recipeCount when adding a vegan copy to the home-page cache', () => {
    cache.writeQuery({
        query: GET_RECIPES,
        variables: HOME_PAGE_VARIABLES,
        data: { recipeMany: [mockRecipeOne], recipeCount: 1, __typename: 'Query' },
    });

    updateRecipeCache(cache, mockRecipeVeganCopy, true);

    expect(
        cache.readQuery({ query: GET_RECIPES, variables: HOME_PAGE_VARIABLES })
    ).toMatchObject({ recipeMany: [expect.objectContaining({ _id: mockRecipeOne._id })], recipeCount: 1 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- run client/src/__tests__/editing.update.test.ts`
Expected: FAIL because `recipeCount` becomes `2` even though the vegan copy is hidden from `recipeMany`.

- [ ] **Step 3: Write minimal implementation**

```ts
recipeCount: (count = 0) => {
    if (!increment || record.originalRecipe) {
        return count;
    }
    return count + 1;
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- run client/src/__tests__/editing.update.test.ts`
Expected: PASS for the new cache consistency regression test.

### Task 6: Run focused regression verification

**Files:**
- Modify: `client/src/__tests__/index.vegan.test.tsx`
- Modify: `client/src/__tests__/editing.update.test.ts`
- Modify: `api/test/graphql/Recipe.test.ts`
- Modify: `client/src/pages/EditRecipe.tsx`
- Modify: `client/src/features/editing/utils/update.ts`
- Modify: `api/src/models/validation.ts`
- Modify: `api/src/schema/Recipe.ts`

- [ ] **Step 1: Run the targeted client regression suites**

Run: `npm test -- run client/src/__tests__/index.vegan.test.tsx client/src/__tests__/editing.update.test.ts`
Expected: PASS with the new redirect and cache regression tests green.

- [ ] **Step 2: Run the targeted API regression suite**

Run: `npm test -- --grep "duplicate an unrelated recipe title|linked vegan version is in use|allow an admin to link a vegan version"`
Expected: PASS for the three new API regression tests.

- [ ] **Step 3: Run broader safety verification**

Run: `npm run lint`
Expected: PASS in `client/`

Run: `./node_modules/.bin/tsc --noEmit`
Expected: PASS in `api/`

## Self-Review

- Spec coverage: all five review findings map directly to Tasks 1-5; Task 6 verifies the combined changes.
- Placeholder scan: no TODO/TBD markers remain; each task includes exact files and commands.
- Type consistency: the plan uses existing `updateRecipeCache`, `recipeLinkVeganVersion`, `recipeArchiveById`, and `recipeUpdateById` naming from the current codebase.
