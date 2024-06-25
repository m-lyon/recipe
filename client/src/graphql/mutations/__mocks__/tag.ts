import { CREATE_TAG } from '@recipe/graphql/mutations/tag';

export const mockTag = {
    __typename: 'Tag' as const,
    _id: '60f4d2e5c3d5a0a4f1b9c0eb',
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
