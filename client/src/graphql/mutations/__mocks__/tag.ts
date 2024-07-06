import { mockTagId } from '@recipe/graphql/__mocks__/ids';
import { CREATE_TAG } from '@recipe/graphql/mutations/tag';

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
        },
    },
    result: {
        data: {
            tagCreateOne: {
                record: mockTag,
            },
        },
    },
};
