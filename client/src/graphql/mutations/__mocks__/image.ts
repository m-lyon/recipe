import { mockTitleNew } from '@recipe/graphql/__mocks__/common';
import { mockTitleOne, mockTitleTwo } from '@recipe/graphql/__mocks__/common';
import { DELETE_IMAGES, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { mockRecipeIdNew, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockImageIdNew, mockImageIdOne, mockImageIdTwo } from '@recipe/graphql/__mocks__/ids';
import { DeleteImagesMutation, DeleteImagesMutationVariables } from '@recipe/graphql/generated';
import { UploadImagesMutation, UploadImagesMutationVariables } from '@recipe/graphql/generated';

export const mockImageFileOne = new File(['hello there'], 'test_image.png', { type: 'image/png' });
export const mockImageFileNew = new File(['hello'], 'test_image_new.png', { type: 'image/png' });
export const mockImageOne = {
    __typename: 'Image' as const,
    _id: mockImageIdOne,
    origUrl: 'test_image.png',
    recipe: {
        __typename: 'Recipe' as const,
        title: mockTitleOne,
    },
};
export const mockImageTwo = {
    ...mockImageOne,
    _id: mockImageIdTwo,
    recipe: {
        __typename: 'Recipe' as const,
        title: mockTitleTwo,
    },
};
export const mockImageNew = {
    __typename: 'Image' as const,
    _id: mockImageIdNew,
    origUrl: 'test_image_new.png',
    recipe: {
        __typename: 'Recipe' as const,
        title: mockTitleNew,
    },
};
export const mockUploadImages = {
    request: {
        query: UPLOAD_IMAGES,
        variables: {
            images: [mockImageFileOne],
            recipeId: mockRecipeIdOne,
        } satisfies UploadImagesMutationVariables,
    },
    result: {
        data: {
            imageUploadMany: { records: [mockImageOne] },
        } satisfies UploadImagesMutation,
    },
};
export const mockUploadImagesNew = {
    request: {
        query: UPLOAD_IMAGES,
        variables: {
            images: [mockImageFileNew],
            recipeId: mockRecipeIdNew,
        } satisfies UploadImagesMutationVariables,
    },
    result: {
        data: {
            imageUploadMany: { records: [mockImageNew] },
        } satisfies UploadImagesMutation,
    },
};
export const mockDeleteImages = {
    request: {
        query: DELETE_IMAGES,
        variables: { ids: [mockImageTwo._id] } satisfies DeleteImagesMutationVariables,
    },
    result: {
        data: {
            imageRemoveMany: { records: [mockImageTwo] },
        } satisfies DeleteImagesMutation,
    },
};
