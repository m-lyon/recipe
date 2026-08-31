import { ModifyIngredientMutation } from '@recipe/graphql/generated';
import { DeleteIngredientMutation } from '@recipe/graphql/generated';
import { DELETE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { mockCarrot } from '@recipe/graphql/queries/__mocks__/ingredient';
import { DeleteIngredientMutationVariables } from '@recipe/graphql/generated';
import { ModifyIngredientMutationVariables } from '@recipe/graphql/generated';
import { CreateIngredientMutationVariables } from '@recipe/graphql/generated';
import { CreateIngredientMutation, Ingredient } from '@recipe/graphql/generated';
import { mockAdminId, mockBeefId, mockOnionId } from '@recipe/graphql/__mocks__/ids';
import { ONION_CUP_DENSITY } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { OLIVE_OIL_CUP_DENSITY } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { CREATE_INGREDIENT, MODIFY_INGREDIENT } from '@recipe/graphql/mutations/ingredient';

export const mockBeef: Ingredient = {
    _id: mockBeefId,
    __typename: 'Ingredient',
    name: 'beef',
    pluralName: 'beef',
    isCountable: false,
    density: null,
    owner: mockAdminId,
    tags: [],
};
export const mockCreateIngredient = {
    request: {
        query: CREATE_INGREDIENT,
        variables: {
            record: {
                name: mockBeef.name,
                pluralName: mockBeef.pluralName,
                isCountable: mockBeef.isCountable,
                tags: mockBeef.tags,
            },
        } satisfies CreateIngredientMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            ingredientCreateOne: {
                __typename: 'CreateOneIngredientPayload',
                record: mockBeef,
            },
        } satisfies CreateIngredientMutation,
    },
};
export const mockOnion: Ingredient = {
    _id: mockOnionId,
    __typename: 'Ingredient',
    name: 'onion',
    pluralName: 'onion',
    isCountable: true,
    density: ONION_CUP_DENSITY,
    owner: mockAdminId,
    tags: [],
};

/** A countable ingredient created with a density accepted from a USDA volume portion.
 *  The density rides in the create record itself, so it saves in one round trip,
 *  before the ingredient (and so any NutritionalInfo link) exists. */
export const mockCreateIngredientOnionWithDensity = {
    request: {
        query: CREATE_INGREDIENT,
        variables: {
            record: {
                name: mockOnion.name,
                pluralName: mockOnion.pluralName,
                isCountable: true,
                tags: [],
                density: ONION_CUP_DENSITY,
            },
        } satisfies CreateIngredientMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            ingredientCreateOne: {
                __typename: 'CreateOneIngredientPayload',
                record: mockOnion,
            },
        } satisfies CreateIngredientMutation,
    },
};

/** The edit flow: an accepted density persists through the ordinary ingredient save. */
export const mockUpdateIngredientCarrotWithDensity = {
    request: {
        query: MODIFY_INGREDIENT,
        variables: {
            id: mockCarrot._id,
            record: {
                name: mockCarrot.name,
                pluralName: mockCarrot.pluralName,
                isCountable: mockCarrot.isCountable,
                tags: mockCarrot.tags,
                density: OLIVE_OIL_CUP_DENSITY,
            },
        } satisfies ModifyIngredientMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            ingredientUpdateById: {
                __typename: 'UpdateByIdIngredientPayload',
                record: { ...mockCarrot, density: OLIVE_OIL_CUP_DENSITY },
            },
        } satisfies ModifyIngredientMutation,
    },
};

export const mockUpdateIngredient = {
    request: {
        query: MODIFY_INGREDIENT,
        variables: {
            id: mockCarrot._id,
            record: {
                name: mockCarrot.name,
                pluralName: 'carrotz',
                isCountable: mockCarrot.isCountable,
                tags: mockCarrot.tags,
            },
        } satisfies ModifyIngredientMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            ingredientUpdateById: {
                __typename: 'UpdateByIdIngredientPayload',
                record: {
                    ...mockCarrot,
                    pluralName: 'carrotz',
                },
            },
        } satisfies ModifyIngredientMutation,
    },
};
export const mockDeleteIngredient = {
    request: {
        query: DELETE_INGREDIENT,
        variables: {
            id: mockCarrot._id,
        } satisfies DeleteIngredientMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            ingredientRemoveById: {
                __typename: 'RemoveByIdIngredientPayload',
                recordId: mockCarrot._id,
            },
        } satisfies DeleteIngredientMutation,
    },
};
