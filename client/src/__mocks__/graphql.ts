import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRatingsRecipeOne } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeTwo } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeThree } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetRecipeTwo, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCountRecipes, mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';

export const mocks = [
    mockGetCurrentUser,
    mockGetTags,
    mockGetIngredientComponents,
    mockGetUnitConversions,
    mockGetRecipeOne,
    mockGetRecipeTwo,
    mockGetRecipeThree,
    mockGetRecipes,
    mockCountRecipes,
    mockGetRatingsRecipeOne,
    mockGetRatingsRecipeTwo,
    mockGetRatingsRecipeThree,
];
