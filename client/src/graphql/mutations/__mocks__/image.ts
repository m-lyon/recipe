import { DELETE_IMAGES, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { mockRecipeOne, mockRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';

export const mockUploadImages = {
    request: {
        query: UPLOAD_IMAGES,
        variables: { images: [new File([], 'image.jpg')], recipeId: mockRecipeOne._id },
    },
    result: {
        data: {
            imageUploadMany: {
                records: [
                    {
                        __typename: 'Image' as const,
                        _id: '60f4d2e5c4d5a0a4f1b9c0ec',
                        origUrl: 'http://localhost:1111/image.jpg',
                        recipe: mockRecipeOne._id,
                    },
                ],
            },
        },
    },
};

export const mockDeleteImages = {
    request: {
        query: DELETE_IMAGES,
        variables: { ids: ['60f4d2e5c4d5a0a4f1b9c0ec'] },
    },
    result: {
        data: {
            imageRemoveMany: {
                records: [
                    {
                        __typename: 'Image' as const,
                        _id: '60f4d2e5c4d5a0a4f1b9c0ec',
                        recipe: mockRecipeThree._id,
                    },
                ],
            },
        },
    },
};
