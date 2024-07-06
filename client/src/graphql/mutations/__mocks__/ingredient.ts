import { CREATE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { mockAdminId, mockCreateRecipeId } from '@recipe/graphql/__mocks__/ids';

export const mockCreateIngredient = {
    request: {
        query: CREATE_INGREDIENT,
        variables: {
            record: {
                name: 'beef',
                pluralName: 'beef',
                isCountable: false,
                tags: [],
            },
        },
    },
    result: {
        data: {
            ingredientCreateOne: {
                record: {
                    __typename: 'IngredientCreate',
                    _id: mockCreateRecipeId,
                    name: 'beef',
                    pluralName: 'beef',
                    isCountable: false,
                    owner: mockAdminId,
                    tags: [],
                },
            },
        },
    },
};
