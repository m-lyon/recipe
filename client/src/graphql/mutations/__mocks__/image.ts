import { DELETE_IMAGES, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { mockRecipeOne, mockRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';

export const mockImageFile = new File(['hello there'], 'test_image.png', { type: 'image/png' });
export const mockImage = {
    __typename: 'Image' as const,
    _id: '60f4d2e5c4d5a0a4f1b9c0ec',
    origUrl: 'test_image.png',
    recipe: {
        __typename: mockRecipeOne.__typename,
        title: mockRecipeOne.title,
    },
};
export const mockUploadImages = {
    request: {
        query: UPLOAD_IMAGES,
        variables: { images: [mockImageFile], recipeId: mockRecipeOne._id },
    },
    result: {
        data: {
            imageUploadMany: {
                records: [mockImage],
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
                        recipe: {
                            __typename: mockRecipeThree.__typename,
                            _id: mockRecipeThree._id,
                        },
                    },
                ],
            },
        },
    },
};
