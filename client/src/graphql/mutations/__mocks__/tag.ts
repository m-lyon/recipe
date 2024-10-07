import { mockTagId } from '@recipe/graphql/__mocks__/ids';
import { CREATE_TAG, REMOVE_TAG } from '@recipe/graphql/mutations/tag';
import { RemoveTagMutation, RemoveTagMutationVariables } from '@recipe/graphql/generated';
import { CreateTagMutation, CreateTagMutationVariables, Tag } from '@recipe/graphql/generated';

export const mockTag: Tag = {
    __typename: 'Tag',
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
            __typename: 'Mutation',
            tagCreateOne: {
                __typename: 'CreateOneTagPayload',
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
            __typename: 'Mutation',
            tagRemoveById: {
                __typename: 'RemoveByIdTagPayload',
                record: mockTag,
            },
        } satisfies RemoveTagMutation,
    },
};
