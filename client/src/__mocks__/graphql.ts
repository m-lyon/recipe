import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetRecipeTwo, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetIngredientAndRecipeIngredients } from '@recipe/graphql/queries/__mocks__/recipe';

export const mocksMinimal = [
    mockCurrentUserAdmin,
    mockGetTags,
    mockGetIngredientComponents,
    mockGetUnitConversions,
    mockGetIngredientAndRecipeIngredients,
];

export const mocks = [
    ...mocksMinimal,
    mockGetRecipeOne,
    mockGetRecipeTwo,
    mockGetRecipeThree,
    mockGetRecipes,
];
