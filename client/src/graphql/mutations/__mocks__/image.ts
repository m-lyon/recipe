import { DELETE_IMAGES, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { mockRecipeIdNew, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockTitleNew, mockTitleOne, mockTitleTwo } from '@recipe/graphql/__mocks__/common';
import { mockImageIdNew, mockImageIdOne, mockImageIdTwo } from '@recipe/graphql/__mocks__/ids';
import { UploadImagesMutation, UploadImagesMutationVariables } from '@recipe/graphql/generated';
import { DeleteImagesMutation, DeleteImagesMutationVariables } from '@recipe/graphql/generated';

export const mockImageFileOne = new File(['hello there'], 'test_image.png', { type: 'image/png' });
export const mockImageFileNew = new File(['hello'], 'test_image_new.png', { type: 'image/png' });
export const mockImageOne: ImageView = {
    __typename: 'Image',
    _id: mockImageIdOne,
    origUrl: 'test_image.png',
    recipe: {
        __typename: 'Recipe',
        title: mockTitleOne,
    },
};
export const mockImageTwo: ImageView = {
    ...mockImageOne,
    _id: mockImageIdTwo,
    recipe: {
        __typename: 'Recipe',
        title: mockTitleTwo,
    },
};
export const mockImageNew: ImageView = {
    __typename: 'Image',
    _id: mockImageIdNew,
    origUrl: 'test_image_new.png',
    recipe: {
        __typename: 'Recipe',
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
            __typename: 'Mutation',
            imageUploadMany: { __typename: 'ImageUploadManyPayload', records: [mockImageOne] },
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
            __typename: 'Mutation',
            imageUploadMany: { __typename: 'ImageUploadManyPayload', records: [mockImageNew] },
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
            __typename: 'Mutation',
            imageRemoveMany: { __typename: 'ImageRemoveManyPayload', records: [mockImageTwo] },
        } satisfies DeleteImagesMutation,
    },
};
