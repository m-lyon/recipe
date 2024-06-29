import { DELETE_IMAGES, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { mockIdOne, mockTitleOne, mockTitleTwo } from '@recipe/graphql/__mocks__/common';

export const mockImageFile = new File(['hello there'], 'test_image.png', { type: 'image/png' });
export const mockImageOne = {
    __typename: 'Image' as const,
    _id: '60f4d2e5c4d5a0a4f1b9c0ec',
    origUrl: 'test_image.png',
    recipe: {
        __typename: 'Recipe' as const,
        title: mockTitleOne,
    },
};
export const mockUploadImages = {
    request: {
        query: UPLOAD_IMAGES,
        variables: { images: [mockImageFile], recipeId: mockIdOne },
    },
    result: {
        data: {
            imageUploadMany: { records: [mockImageOne] },
        },
    },
};
export const mockImageTwo = {
    ...mockImageOne,
    _id: '60f4d2e5c4d5a0a4f1b9c0ed',
    recipe: {
        __typename: 'Recipe' as const,
        title: mockTitleTwo,
    },
};
export const mockDeleteImages = {
    request: {
        query: DELETE_IMAGES,
        variables: { ids: [mockImageTwo._id] },
    },
    result: {
        data: {
            imageRemoveMany: { records: [mockImageTwo] },
        },
    },
};
