import { Resolver, ResolverNextRpCb, SchemaComposer } from 'graphql-compose';

import { UsdaQuery } from './Usda.js';
import { Unit } from '../models/Unit.js';
import { Size } from '../models/Size.js';
import { Recipe } from '../models/Recipe.js';
import { GraphQLContext } from '../types.js';
import { TagMutation, TagQuery } from './Tag.js';
import { UserMutation, UserQuery } from './User.js';
import { Ingredient } from '../models/Ingredient.js';
import { PrepMethod } from '../models/PrepMethod.js';
import { ImageMutation, ImageQuery } from './Image.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { RecipeMutation, RecipeQuery } from './Recipe.js';
import { RatingMutation, RatingQuery } from './Rating.js';
import { DisplayLadder } from '../models/DisplayLadder.js';
import { SizeMutation, SizeQuery, SizeQueryAdmin } from './Size.js';
import { UnitMutation, UnitQuery, UnitQueryAdmin } from './Unit.js';
import { IngredientMutation, IngredientQuery } from './Ingredient.js';
import { isAdmin, isImageOwnerOrAdmin } from '../middleware/authorisation.js';
import { isNutritionalInfoOwnerOrAdmin } from '../middleware/authorisation.js';
import { DisplayLadderMutation, DisplayLadderQuery } from './DisplayLadder.js';
import { isIngredientMeasureOwnerOrAdmin } from '../middleware/authorisation.js';
import { isDocumentOwnerOrAdmin, isVerified } from '../middleware/authorisation.js';
import { NutritionalInfoMutation, NutritionalInfoQuery } from './NutritionalInfo.js';
import { IngredientMeasureMutation, IngredientMeasureQuery } from './IngredientMeasure.js';
import { PrepMethodMutation, PrepMethodQuery, PrepMethodQueryAdmin } from './PrepMethod.js';

export const USDA_SEARCH_LIMIT = 60;
export const USDA_SEARCH_WINDOW_MS = 60 * 60 * 1000;
export const USDA_FOOD_ITEM_LIMIT = 300;
export const USDA_FOOD_ITEM_WINDOW_MS = 60 * 60 * 1000;

type Middleware = ResolverNextRpCb<unknown, GraphQLContext>;

/**
 * Wraps every resolver in the map with the given middleware. The first middleware is the
 * outermost, so it runs first.
 */
function withMiddleware(
    resolvers: Record<string, Resolver>,
    ...middleware: Middleware[]
): Record<string, Resolver> {
    const wrapped: Record<string, Resolver> = {};
    for (const [name, resolver] of Object.entries(resolvers)) {
        wrapped[name] = middleware.reduceRight(
            (composed, next) => composed.wrapResolve(next),
            resolver
        );
    }
    return wrapped;
}

const isAdminMutations = withMiddleware(
    {
        ...TagMutation,
    },
    isAdmin()
);
const isAdminQueries = withMiddleware(
    {
        ...SizeQueryAdmin,
        ...UnitQueryAdmin,
        ...PrepMethodQueryAdmin,
    },
    isAdmin()
);
// The USDA proxy spends a single server-wide API key (1000 requests/hour), so it is
// capped per user: search more tightly, usdaFoodItem more loosely since bulk linking
// looks up many fdcIds.
const usdaQueries = {
    ...withMiddleware(
        { usdaSearch: UsdaQuery.usdaSearch },
        isVerified(),
        rateLimit('usdaSearch', USDA_SEARCH_LIMIT, USDA_SEARCH_WINDOW_MS)
    ),
    ...withMiddleware(
        { usdaFoodItem: UsdaQuery.usdaFoodItem },
        isVerified(),
        rateLimit('usdaFoodItem', USDA_FOOD_ITEM_LIMIT, USDA_FOOD_ITEM_WINDOW_MS)
    ),
};
const isAuthenticatedMutations = withMiddleware(
    {
        recipeCreateOne: RecipeMutation.recipeCreateOne,
        recipeCreateVeganVersion: RecipeMutation.recipeCreateVeganVersion,
        ratingCreateOne: RatingMutation.ratingCreateOne,
        sizeCreateOne: SizeMutation.sizeCreateOne,
        unitCreateOne: UnitMutation.unitCreateOne,
        prepMethodCreateOne: PrepMethodMutation.prepMethodCreateOne,
        ingredientCreateOne: IngredientMutation.ingredientCreateOne,
        displayLadderCreateOne: DisplayLadderMutation.displayLadderCreateOne,
    },
    isVerified()
);
const isNutritionalInfoOwnerOrAdminMutations = withMiddleware(
    NutritionalInfoMutation,
    isVerified(),
    isNutritionalInfoOwnerOrAdmin()
);
const isIngredientMeasureOwnerOrAdminMutations = withMiddleware(
    IngredientMeasureMutation,
    isVerified(),
    isIngredientMeasureOwnerOrAdmin()
);
const isDisplayLadderOwnerOrAdminMutations = withMiddleware(
    {
        displayLadderUpdateById: DisplayLadderMutation.displayLadderUpdateById,
        displayLadderRemoveById: DisplayLadderMutation.displayLadderRemoveById,
    },
    isDocumentOwnerOrAdmin(DisplayLadder)
);
const isImageOwnerOrAdminMutations = withMiddleware(
    { imageRemoveMany: ImageMutation.imageRemoveMany },
    isImageOwnerOrAdmin()
);
const isRecipeOwnerOrAdminMutations = withMiddleware(
    {
        recipeUpdateById: RecipeMutation.recipeUpdateById,
        recipeRemoveById: RecipeMutation.recipeRemoveById,
        recipeArchiveById: RecipeMutation.recipeArchiveById,
        recipeUnarchiveById: RecipeMutation.recipeUnarchiveById,
        imageUploadOne: ImageMutation.imageUploadOne,
        imageUploadMany: ImageMutation.imageUploadMany,
    },
    isDocumentOwnerOrAdmin(Recipe)
);
const isUnitOwnerOrAdminMutations = withMiddleware(
    {
        unitUpdateById: UnitMutation.unitUpdateById,
        unitRemoveById: UnitMutation.unitRemoveById,
    },
    isDocumentOwnerOrAdmin(Unit)
);
const isSizeOwnerOrAdminMutations = withMiddleware(
    {
        sizeUpdateById: SizeMutation.sizeUpdateById,
        sizeRemoveById: SizeMutation.sizeRemoveById,
    },
    isDocumentOwnerOrAdmin(Size)
);
const isIngredientOwnerOrAdminMutations = withMiddleware(
    {
        ingredientUpdateById: IngredientMutation.ingredientUpdateById,
        ingredientRemoveById: IngredientMutation.ingredientRemoveById,
    },
    isDocumentOwnerOrAdmin(Ingredient)
);
const isPrepMethodOwnerOrAdminMutations = withMiddleware(
    {
        prepMethodUpdateById: PrepMethodMutation.prepMethodUpdateById,
        prepMethodRemoveById: PrepMethodMutation.prepMethodRemoveById,
    },
    isDocumentOwnerOrAdmin(PrepMethod)
);

const schemaComposer = new SchemaComposer();
schemaComposer.Query.addFields({
    ...TagQuery,
    ...UserQuery,
    ...UnitQuery,
    ...SizeQuery,
    ...PrepMethodQuery,
    ...IngredientQuery,
    ...RecipeQuery,
    ...RatingQuery,
    ...ImageQuery,
    ...DisplayLadderQuery,
    ...IngredientMeasureQuery,
    ...NutritionalInfoQuery,
    ...usdaQueries,
    ...isAdminQueries,
});
schemaComposer.Mutation.addFields({
    ...UserMutation,
    ...isAdminMutations,
    ...isAuthenticatedMutations,
    ...isRecipeOwnerOrAdminMutations,
    ...isUnitOwnerOrAdminMutations,
    ...isSizeOwnerOrAdminMutations,
    ...isIngredientOwnerOrAdminMutations,
    ...isPrepMethodOwnerOrAdminMutations,
    ...isNutritionalInfoOwnerOrAdminMutations,
    ...isIngredientMeasureOwnerOrAdminMutations,
    ...isDisplayLadderOwnerOrAdminMutations,
    ...isImageOwnerOrAdminMutations,
});

export const schema = schemaComposer.buildSchema();
