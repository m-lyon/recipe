import { ModifyIngredientMutation } from '@recipe/graphql/generated';
import { DeleteIngredientMutation } from '@recipe/graphql/generated';
import { mockAdminId, mockBeefId } from '@recipe/graphql/__mocks__/ids';
import { DELETE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { mockCarrot } from '@recipe/graphql/queries/__mocks__/ingredient';
import { DeleteIngredientMutationVariables } from '@recipe/graphql/generated';
import { ModifyIngredientMutationVariables } from '@recipe/graphql/generated';
import { CreateIngredientMutationVariables } from '@recipe/graphql/generated';
import { CreateIngredientMutation, Ingredient } from '@recipe/graphql/generated';
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
