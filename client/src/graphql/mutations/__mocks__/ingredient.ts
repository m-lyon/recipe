import { CREATE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';

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
                    _id: '60f4d2e5c3d5a0a4f1b9c0f7',
                    name: 'beef',
                    pluralName: 'beef',
                    isCountable: false,
                    owner: '60f4d2e5c3d5a0a4f1b9d0f7',
                    tags: [],
                },
            },
        },
    },
};
