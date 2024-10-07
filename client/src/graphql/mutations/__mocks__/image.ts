import { Image } from '@recipe/graphql/generated';
import { mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { DELETE_IMAGES, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { mockRecipeIdNew, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeNew, mockRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockImageIdNew, mockImageIdOne, mockImageIdTwo } from '@recipe/graphql/__mocks__/ids';
import { UploadImagesMutation, UploadImagesMutationVariables } from '@recipe/graphql/generated';
import { DeleteImagesMutation, DeleteImagesMutationVariables } from '@recipe/graphql/generated';

export const mockImageFileOne = new File(['hello there'], 'test_image.png', { type: 'image/png' });
export const mockImageFileNew = new File(['hello'], 'test_image_new.png', { type: 'image/png' });
export const mockImageOne: Image = {
    __typename: 'Image',
    _id: mockImageIdOne,
    origUrl: 'test_image.png',
    lowresUrl: null,
    note: null,
    recipe: mockRecipeOne,
};
export const mockImageTwo: Image = {
    ...mockImageOne,
    _id: mockImageIdTwo,
    recipe: mockRecipeTwo,
};
export const mockImageNew: Image = {
    __typename: 'Image',
    _id: mockImageIdNew,
    origUrl: 'test_image_new.png',
    lowresUrl: null,
    note: null,
    recipe: mockRecipeNew,
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
