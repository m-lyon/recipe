import { mockTagId } from '@recipe/graphql/__mocks__/ids';
import { CREATE_TAG, REMOVE_TAG } from '@recipe/graphql/mutations/tag';
import { CreateTagMutation, CreateTagMutationVariables } from '@recipe/graphql/generated';
import { RemoveTagMutation, RemoveTagMutationVariables } from '@recipe/graphql/generated';

export const mockTag = {
    __typename: 'Tag' as const,
    _id: mockTagId,
    value: 'mock tag',
};
export const mockCreateTag = {
    request: {
        query: CREATE_TAG,
        variables: {
            record: {
                value: mockTag.value,
            },
        } satisfies CreateTagMutationVariables,
    },
    result: {
        data: {
            tagCreateOne: {
                record: mockTag,
            },
        } satisfies CreateTagMutation,
    },
};
export const mockRemoveTag = {
    request: {
        query: REMOVE_TAG,
        variables: {
            recordId: mockTagId,
        } satisfies RemoveTagMutationVariables,
    },
    result: {
        data: {
            tagRemoveById: {
                record: mockTag,
            },
        } satisfies RemoveTagMutation,
    },
};
