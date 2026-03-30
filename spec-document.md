# Spec: Archive Recipes Instead of Delete (Issue #72)

## Overview

Replace the hard-delete mechanism with a soft-archive. Deleting a recipe via the UI will now **archive** it instead of permanently removing it from the database. Archived recipes:

- Are hidden from the normal recipe list and search results.
- Can be viewed via a dedicated **"Show archived" toggle** on the home page.
- Can be **unarchived** (restored) from the archived view.
- Still **block deletion of any attributes they reference** (Units, Ingredients, PrepMethods, Sizes) — same as non-archived recipes (Option A).
- Cannot be edited while archived.
- Are permanently removed only by direct database access; there is no UI hard-delete.

The archive/unarchive actions are available to both the **recipe owner** and **admins**.

---

## Key Design Decisions

### `archived: boolean` field (not `archivedAt`)

A simple boolean is sufficient. The issue does not require knowing *when* a recipe was archived. `archived: false` is the default for all new documents; the migration script explicitly sets it on all existing documents.

### Client-side filter responsibility (no server-side default filter)

There is **no server-side resolver wrapping** to auto-exclude archived recipes. The client is responsible for passing the appropriate `archived` filter on every `recipeMany` / `recipeCount` call. This keeps the API simple and makes `GET_LINKED_RECIPES` (which should show ALL recipes using an attribute, including archived ones) work correctly without a special override.

Concretely:

| Query | `archived` filter to add |
|---|---|
| `GET_RECIPES` (normal view) | `{ archived: false }` always merged in |
| `GET_RECIPES` (archived toggle view) | `{ archived: true }` |
| `GET_INGREDIENT_AND_RECIPE_INGREDIENTS` | `{ archived: false }` added to existing `isIngredient: true` filter |
| `GET_INGREDIENT_COMPONENTS` | `{ archived: false }` added to existing `isIngredient: true` filter |
| `GET_LINKED_RECIPES` | **No change** — must show archived recipes so users understand why attribute deletion is blocked |

### Archiving blocked if recipe is used as an ingredient

The `recipeArchiveById` mutation uses the same `validateItemNotInRecipe` check as the current `recipeRemoveById`. If the recipe-to-archive is itself used as an ingredient in another (non-archived) recipe, archiving is blocked with `ITEM_IN_USE`.

### `recipeRemoveById` retired from public API

`recipeRemoveById` is removed from the exported `RecipeMutation` object in `api/src/schema/index.ts`. The underlying code can remain in `api/src/schema/Recipe.ts` for reference, but it is no longer exposed as a GQL mutation. No client UI hard-delete is provided.

### Archive action requires confirmation; unarchive does not

Archiving is a meaningful action (hides the recipe), so it keeps a confirmation modal (replacing `ConfirmDeleteModal`). Unarchiving is non-destructive and immediate — no modal is shown.

### Archive icon from `@chakra-ui/icons` / custom

`@chakra-ui/icons` does not include an archive icon. Use a Chakra `Icon` component wrapping a custom SVG path (a simple inbox/tray shape). The unarchive icon is the same shape with an upward arrow variant. Both `aria-label` attributes must be descriptive.

### `showArchived` toggle clears and disables search filters

When `showArchived` is true: the title search bar, tag filter, and ingredient filter are cleared and hidden (or disabled). The archived view is a flat list of all the user's archived recipes sorted by `MODIFIED_DESC`. When the toggle is turned off, the normal search UI is restored.

### `recipeCount` always reflects the current view

`recipeCount` consistently uses the same archived filter as `recipeMany` so that infinite-scroll pagination (`hasMore = recipeCount > recipes.length`) works correctly in both views.

---

## Codebase Context

### Key Files

| File | Role |
|---|---|
| `api/src/models/Recipe.ts` | Add `archived: boolean` (default `false`) to model schema and interface |
| `api/src/schema/Recipe.ts` | Add `recipeArchiveById` + `recipeUnarchiveById` mutations; remove `recipeRemoveById` from exports |
| `api/src/middleware/validation.ts` | `validateItemNotInRecipe` — **no change needed** (already checks all recipes including archived) |
| `api/src/scripts/updateSchema_2026-03-30.js` | **New** migration — sets `archived: false` on all existing Recipe documents |
| `client/src/graphql/mutations/recipe.ts` | Add `ARCHIVE_RECIPE`, `UNARCHIVE_RECIPE`; remove `DELETE_RECIPE` |
| `client/src/graphql/queries/recipe.ts` | Add `archived` to `RECIPE_FIELDS_SUBSET`; add `archived` filter to `GET_INGREDIENT_AND_RECIPE_INGREDIENTS` and `GET_INGREDIENT_COMPONENTS` |
| `client/src/features/search/utils/filter.ts` | `getSearchFilter` always injects `{ archived: false }` unless `showArchived=true`; signature gains `showArchived` param |
| `client/src/features/search/hooks/useSearch.tsx` | Pass `showArchived` from store to `getSearchFilter`; re-trigger debounced search when `showArchived` changes |
| `client/src/stores/useSearchStore.tsx` | Add `showArchived: boolean` + `setShowArchived` to shared slice |
| `client/src/features/search/components/SearchBar.tsx` | Add archive toggle switch; hide/disable search inputs when `showArchived=true` |
| `client/src/features/viewing/components/ModifyButtons.tsx` | Replace `CloseIcon` delete button with Archive button (when `!recipe.archived`); show Unarchive button only (when `recipe.archived`) |
| `client/src/features/editing/components/ConfirmArchiveModal.tsx` | **New** — replaces `ConfirmDeleteModal.tsx`; uses `ARCHIVE_RECIPE` mutation with same cache update logic |
| `client/src/features/editing/components/ConfirmDeleteModal.tsx` | **Delete this file** (replaced by `ConfirmArchiveModal.tsx`) |
| `client/src/features/viewing/components/RecipeCardsContainer.tsx` | Update initial `useQuery` to pass `filter: { archived: false }`; swap `ConfirmDeleteModal` for `ConfirmArchiveModal`; add `handleUnarchive` handler |
| `client/src/features/editing/index.ts` | Export `ConfirmArchiveModal`; remove `ConfirmDeleteModal` export |

### Data Flow

```
Home page (normal view, showArchived=false)
  └─ useSearchStore.showArchived = false
       └─ getSearchFilter(query, false)
            └─ returns { AND: [{ archived: false }, ...searchFilters] }
                 └─ GET_RECIPES(filter, countFilter) → shows only non-archived recipes

Home page (archived toggle on, showArchived=true)
  └─ useSearchStore.showArchived = true
       └─ getSearchFilter(query, true)
            └─ returns { archived: true }  (search filters ignored)
                 └─ GET_RECIPES(filter, countFilter) → shows only archived recipes

Archive action (from normal view card)
  └─ ModifyButtons → onClick(recipe._id)
       └─ RecipeCardsContainer sets recipeId + show=true
            └─ ConfirmArchiveModal shown
                 └─ User confirms → ARCHIVE_RECIPE mutation
                      └─ API: validateItemNotInRecipe → if ok, set archived=true
                           └─ cache.evict(Recipe:id) + recipeCount - 1

Unarchive action (from archived view card)
  └─ ModifyButtons → direct onClick (no modal)
       └─ UNARCHIVE_RECIPE mutation (inline in ModifyButtons or RecipeCardsContainer)
            └─ API: set archived=false
                 └─ cache.evict(Recipe:id) + recipeCount - 1
```

### Current Delete Flow (to be replaced)

```
ModifyButtons (CloseIcon) → RecipeCardsContainer.handleDelete()
  └─ ConfirmDeleteModal (DELETE_RECIPE mutation)
       └─ API: validateItemNotInRecipe → cascade-delete images + ratings → hard-delete Recipe doc
            └─ cache.evict + recipeCount - 1
```

---

## Implementation Plan

### 1. API — Recipe Model (`api/src/models/Recipe.ts`)

Add `archived` to the mongoose schema and TypeScript interface:

```typescript
// In RecipeSchema (mongoose SchemaDefinition):
archived: { type: Boolean, default: false }

// In Recipe interface:
archived: boolean;
```

---

### 2. API — GraphQL Mutations (`api/src/schema/Recipe.ts`)

#### 2a. `recipeArchiveById`

Add a new resolver that:
1. Uses the same **auth wrapping** as the existing `recipeRemoveById` (owner or admin check via `isDocumentOwnerOrAdmin(Recipe)`).
2. Runs `validateItemNotInRecipe(rp.args._id, 'recipe')` — same as delete, to block archiving if the recipe is used as an ingredient elsewhere.
3. Sets `archived: true` via `Recipe.findByIdAndUpdate(rp.args._id, { archived: true })`.

```typescript
RecipeModifyTC.addResolver({
    name: 'archiveById',
    type: RecipeTC.mongooseResolvers.removeById().getType(),  // reuse removeById return type (recordId)
    args: { _id: 'MongoID!' },
    resolve: async ({ args }) => {
        const record = await Recipe.findByIdAndUpdate(args._id, { archived: true }, { new: true });
        return { recordId: record?._id, record };
    },
});
```

Wrap with `wrapResolve` for `validateItemNotInRecipe`, then export under `RecipeMutation` inside `isRecipeOwnerOrAdminMutations`.

#### 2b. `recipeUnarchiveById`

Add a resolver that:
1. Uses the same auth wrapping (owner or admin).
2. No `validateItemNotInRecipe` check needed.
3. Sets `archived: false` via `Recipe.findByIdAndUpdate(rp.args._id, { archived: false })`.

#### 2c. Remove `recipeRemoveById` from `RecipeMutation`

Remove the `recipeRemoveById` key from the `isRecipeOwnerOrAdminMutations` object in `api/src/schema/index.ts`. The resolver definition in `Recipe.ts` may remain for reference but must not be exposed.

---

### 3. API — Migration Script (`api/src/scripts/updateSchema_2026-03-30.js`)

```javascript
// updateSchema_2026-03-30.js
// Sets archived: false on all existing Recipe documents that lack the field.
db.recipes.updateMany(
    { archived: { $exists: false } },
    { $set: { archived: false } }
);
```

---

### 4. Client — GraphQL Mutations (`client/src/graphql/mutations/recipe.ts`)

Remove `DELETE_RECIPE`. Add:

```typescript
export const ARCHIVE_RECIPE = gql(`
    mutation ArchiveRecipe($id: MongoID!) {
        recipeArchiveById(_id: $id) {
            recordId
        }
    }
`);

export const UNARCHIVE_RECIPE = gql(`
    mutation UnarchiveRecipe($id: MongoID!) {
        recipeUnarchiveById(_id: $id) {
            recordId
        }
    }
`);
```

---

### 5. Client — GraphQL Fragments and Queries (`client/src/graphql/queries/recipe.ts`)

#### 5a. Add `archived` to `RECIPE_FIELDS_SUBSET`

```graphql
fragment RecipeFieldsSubset on Recipe {
    ...RecipeIngrFields
    titleIdentifier
    archived        # <-- ADD THIS
    tags { ...TagFields }
    isIngredient
    numServings
    images { ...ImageFields }
    ratings { ...RatingFields }
    calculatedTags
    owner
}
```

#### 5b. Update `GET_INGREDIENT_AND_RECIPE_INGREDIENTS`

Change `filter: {isIngredient: true}` to `filter: {isIngredient: true, archived: false}` for both recipe sub-queries.

#### 5c. Update `GET_INGREDIENT_COMPONENTS`

Same change as above — add `archived: false` to the `filter` on the `recipes: recipeMany(...)` sub-query.

After these changes, run `npm run generate` (or the project's codegen command) to regenerate `__generated__/graphql.ts`.

---

### 6. Client — Search Filter (`client/src/features/search/utils/filter.ts`)

Change the `getSearchFilter` signature to accept `showArchived: boolean` and always include an archived filter:

```typescript
export function getSearchFilter(
    query: Query,
    showArchived: boolean
): FilterFindManyRecipeInput {
    if (showArchived) {
        return { archived: true };
    }
    const { title, tags, calculatedTags, ingredients } = query;
    const filters: FilterFindManyRecipeInput[] = [{ archived: false }];
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

Note: the return type changes from `FilterFindManyRecipeInput | undefined` to `FilterFindManyRecipeInput` — the filter is now always defined.

---

### 7. Client — Search Store (`client/src/stores/useSearchStore.tsx`)

Add `showArchived` to the `SharedSlice` interface and `createSharedSlice` implementation:

```typescript
interface SharedSlice {
    showArchived: boolean;
    setShowArchived: (showArchived: boolean) => void;
    // ... existing fields
}

// In createSharedSlice:
showArchived: false,
setShowArchived: (showArchived) => set(() => ({ showArchived })),
```

When `setShowArchived(true)` is called, also reset all active search filters (`resetSearch` minus the `showSearch` toggle):

```typescript
setShowArchived: (showArchived) => {
    set(() => ({ showArchived }));
    if (showArchived) {
        get().resetTitleFilter();
        get().resetTagFilter();
        get().resetIngrFilter();
    }
},
```

---

### 8. Client — `useSearch` Hook (`client/src/features/search/hooks/useSearch.tsx`)

1. Read `showArchived` from the store.
2. Pass it to `getSearchFilter`.
3. Trigger a debounced search when `showArchived` changes (using a `useEffect`).

```typescript
const showArchived = useSearchStore((state) => state.showArchived);

const filter = useMemo(
    () => getSearchFilter({ title, tags, calculatedTags, ingredients }, showArchived),
    [title, tags, calculatedTags, ingredients, showArchived]
);

// Trigger refetch when showArchived changes
useEffect(() => {
    searchRecipes({
        variables: {
            offset: 0,
            limit: INIT_LOAD_NUM,
            filter,
            countFilter: filter,
        },
    });
}, [showArchived]); // eslint-disable-line react-hooks/exhaustive-deps
```

Also expose `showArchived` and `setShowArchived` from the hook's return value so `SearchBar` can render the toggle.

```typescript
interface SearchHook {
    filter: ReturnType<typeof getSearchFilter>;
    showArchived: boolean;
    setShowArchived: (v: boolean) => void;
    setTitle: (value: string) => void;
    reset: () => void;
    addFilter: (item: FilterChoice, type: FilterChoiceType) => void;
    removeFilter: (item: FilterChoice) => void;
}
```

---

### 9. Client — Search Bar Toggle (`client/src/features/search/components/SearchBar.tsx`)

Add an "Show archived" toggle. When `showArchived=true`, hide/disable the title `Input` and pass `showArchived` to parent so the filter components are also hidden.

```tsx
import { Switch, FormControl, FormLabel, HStack } from '@chakra-ui/react';

interface Props {
    // ... existing props
    showArchived: boolean;
    setShowArchived: (v: boolean) => void;
}
export function SearchBar(props: Props) {
    const { setTitleFilter, resetSearch, closeNavDropdown, showArchived, setShowArchived } = props;
    // ...
    return (
        <HStack spacing={3} w='100%'>
            {!showArchived && (
                <InputGroup>
                    {/* existing search input unchanged */}
                </InputGroup>
            )}
            <FormControl display='flex' alignItems='center' w='auto' flexShrink={0}>
                <FormLabel htmlFor='archive-toggle' mb='0' fontSize='sm' whiteSpace='nowrap'>
                    Show archived
                </FormLabel>
                <Switch
                    id='archive-toggle'
                    isChecked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    aria-label='Toggle archived recipes view'
                />
            </FormControl>
        </HStack>
    );
}
```

The parent component that renders `SearchBar` (likely `index.tsx` of the search feature or the home page layout) must also hide `TagFilter` and `IngredientFilter` when `showArchived=true`.

---

### 10. Client — `ModifyButtons.tsx` (`client/src/features/viewing/components/ModifyButtons.tsx`)

Replace the `CloseIcon` delete button with conditional archive/unarchive logic:

- `recipe.archived === false` → show **Edit** button + **Archive** button (existing layout)
- `recipe.archived === true` → show only **Unarchive** button (no Edit button)

The Archive button calls `handleArchive(recipe._id)` (triggers the confirm modal via `RecipeCardsContainer`). The Unarchive button fires the mutation directly (no modal).

**Icon:** Use `@chakra-ui/react`'s `Icon` component with a custom SVG path for the archive icon. Example archive box icon path:

```tsx
// ArchiveIcon (custom)
export function ArchiveIcon(props: IconProps) {
    return (
        <Icon viewBox='0 0 24 24' {...props}>
            <path
                fill='currentColor'
                d='M20 3H4c-1.1 0-2 .9-2 2v2c0 .75.41 1.38 1 1.72V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8.72c.59-.34 1-.97 1-1.72V5c0-1.1-.9-2-2-2zm-5 12H9v-2h6v2zm5-8H4V5h16v2z'
            />
        </Icon>
    );
}
```

Place this in `client/src/common/icons/` or directly in the component file.

**Updated `ModifyButtons`:**

```tsx
import { useMutation } from '@apollo/client';
import { EditIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Spacer, Tooltip } from '@chakra-ui/react';

import { UNARCHIVE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { ArchiveIcon, UnarchiveIcon } from '@recipe/common/icons';

interface Props {
    recipe: RecipePreview;  // RecipePreview now includes archived: boolean
    isHovering: boolean;
    hasEditPermission: boolean;
    handleArchive: (id: string) => void;
}
export function ModifyButtons(props: Props) {
    const { recipe, isHovering, hasEditPermission, handleArchive } = props;
    const [unarchiveRecipe] = useMutation(UNARCHIVE_RECIPE, {
        variables: { id: recipe._id },
        update(cache) {
            cache.evict({ id: `Recipe:${recipe._id}` });
            cache.modify({
                fields: { recipeCount: (c) => c - 1 },
            });
        },
    });

    if (!hasEditPermission) return null;

    if (recipe.archived) {
        return (
            <Box zIndex={1} position='absolute'>
                <Tooltip label={`Unarchive ${recipe.title}`} openDelay={500}>
                    <IconButton
                        aria-label={`Unarchive ${recipe.title}`}
                        icon={<UnarchiveIcon />}
                        onClick={() => unarchiveRecipe()}
                        // ... same styling as existing buttons
                    />
                </Tooltip>
            </Box>
        );
    }

    return (
        <Flex minWidth='max-content' direction='row'>
            {/* Edit button — unchanged */}
            <Spacer />
            <Box zIndex={1}>
                <Box position='absolute'>
                    <Tooltip label={`Archive ${recipe.title}`} openDelay={500}>
                        <IconButton
                            aria-label={`Archive ${recipe.title}`}
                            icon={<ArchiveIcon />}
                            onClick={() => handleArchive(recipe._id)}
                            // ... same styling as existing delete button
                        />
                    </Tooltip>
                </Box>
            </Box>
        </Flex>
    );
}
```

---

### 11. Client — `ConfirmArchiveModal.tsx` (new file, replaces `ConfirmDeleteModal.tsx`)

Same structure as `ConfirmDeleteModal` with three changes:
1. Mutation: `ARCHIVE_RECIPE` instead of `DELETE_RECIPE`
2. Text: "Archive Recipe" / "Are you sure you want to archive this recipe? You can restore it later."
3. Button: keep `colorScheme='red'` or change to `colorScheme='orange'` — implementing agent to decide based on visual style.

Cache update is identical:
```typescript
update(cache) {
    cache.evict({ id: `Recipe:${recipeId}` });
    cache.modify({
        fields: { recipeCount: (existingCount) => existingCount - 1 },
    });
},
```

---

### 12. Client — `RecipeCardsContainer.tsx`

Four changes:

1. **Initial `useQuery` variables** — pass the default archived filter:
```typescript
const defaultFilter = { archived: false };
const { data, loading, error, fetchMore } = useQuery(GET_RECIPES, {
    variables: { offset: 0, limit: INIT_LOAD_NUM, filter: defaultFilter, countFilter: defaultFilter },
});
```

2. **Rename `handleDelete` to `handleArchive`** and update all call sites.

3. **Replace `ConfirmDeleteModal` with `ConfirmArchiveModal`**:
```tsx
<ConfirmArchiveModal show={show} setShow={setShow} recipeId={recipeId} />
```

4. **Pass updated `handleArchive` prop to `RecipeCard` / `ImageRecipeCard`**, which forward it to `ModifyButtons`.

The `fetchMore` callback already passes `filter` and `countFilter` from `useSearch()`, which now always includes the appropriate archived filter — no change needed there.

---

### 13. Client — Type Update

The generated `RecipeFieldsSubset` type (in `__generated__/graphql.ts`) will automatically include `archived: boolean` after codegen. Update any hand-authored `RecipePreview` type aliases (check `client/src/types/`) to also include `archived: boolean`.

---

## Testing

### API Tests (`api/test/graphql/Recipe.test.ts`)

Add tests for:
- `recipeArchiveById`: archives a recipe; blocked if recipe is used as ingredient; blocked if not owner; admin can archive any recipe.
- `recipeUnarchiveById`: restores an archived recipe; blocked if not owner; admin can unarchive any.
- `recipeMany` / `recipeCount` with `filter: { archived: false }` returns only non-archived; with `filter: { archived: true }` returns only archived.
- `recipeRemoveById` is no longer exposed (mutation should not exist in schema).

### Client Tests (`client/src/__tests__/`)

Relevant existing test files to update:
- `index.delete.recipe.test.tsx` → rename to `index.archive.recipe.test.tsx`. Update mocks from `DELETE_RECIPE` to `ARCHIVE_RECIPE`. Existing tests:
  1. Archive a plain recipe → confirm modal shown → recipe disappears from list
  2. Archive a recipe-as-ingredient → it disappears from ingredient dropdown
  3. Archive after first viewing a recipe

New test cases to add:
- Clicking the archive toggle shows archived recipes.
- Unarchive button appears on archived recipe cards; clicking it removes the recipe from archived view.
- When `showArchived=true`, title/tag/ingredient search inputs are hidden.
- `recipeCount` decrements on archive and unarchive.

---

## Migration Checklist

1. Run `api/src/scripts/updateSchema_2026-03-30.js` against the database **before** deploying the new API.
2. Run `npm run generate` in `client/` after updating GraphQL fragments to regenerate `__generated__/graphql.ts`.
3. Remove `ConfirmDeleteModal.tsx` only after `ConfirmArchiveModal.tsx` is in place and all imports updated.
4. Verify `recipeRemoveById` is absent from the introspected schema after deploy.
