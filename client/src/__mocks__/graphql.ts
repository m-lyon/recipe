import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetDisplayLadders } from '@recipe/graphql/queries/__mocks__/displayLadder';
import { mockGetRecipeTwo, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetIngredientAndRecipeIngredients } from '@recipe/graphql/queries/__mocks__/recipe';

export const mocksMinimal = [
    mockCurrentUserAdmin,
    mockGetTags,
    mockGetIngredientComponents,
    mockGetDisplayLadders,
    mockGetIngredientAndRecipeIngredients,
];

export const mocks = [
    ...mocksMinimal,
    mockGetRecipeOne,
    mockGetRecipeTwo,
    mockGetRecipeThree,
    mockGetRecipes,
];
