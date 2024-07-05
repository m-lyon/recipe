import { mockTitleOne, mockTitleTwo } from '@recipe/graphql/__mocks__/common';
import { DELETE_IMAGES, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { mockIdNew, mockIdOne, mockTitleNew } from '@recipe/graphql/__mocks__/common';

export const mockImageFileOne = new File(['hello there'], 'test_image.png', { type: 'image/png' });
export const mockImageFileNew = new File(['hello'], 'test_image_new.png', { type: 'image/png' });
export const mockImageOne = {
    __typename: 'Image' as const,
    _id: '60f4d2e5c4d5a0a4f1b9c0ec',
    origUrl: 'test_image.png',
    recipe: {
        __typename: 'Recipe' as const,
        title: mockTitleOne,
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
export const mockImageNew = {
    __typename: 'Image' as const,
    _id: '60f4d2e5c4d5a0a4d1b9c0ed',
    origUrl: 'test_image_new.png',
    recipe: {
        __typename: 'Recipe' as const,
        title: mockTitleNew,
    },
};
export const mockUploadImages = {
    request: {
        query: UPLOAD_IMAGES,
        variables: { images: [mockImageFileOne], recipeId: mockIdOne },
    },
    result: {
        data: {
            imageUploadMany: { records: [mockImageOne] },
        },
    },
};
export const mockUploadImagesNew = {
    request: {
        query: UPLOAD_IMAGES,
        variables: { images: [mockImageFileNew], recipeId: mockIdNew },
    },
    result: {
        data: {
            imageUploadMany: { records: [mockImageNew] },
        },
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
