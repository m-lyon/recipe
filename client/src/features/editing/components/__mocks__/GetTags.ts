import { GET_TAGS } from '../../../../graphql/queries/tag';

export const mockGetTags = {
    request: {
        query: GET_TAGS,
    },
    result: {
        data: {
            tagMany: [
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                    value: 'dinner',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0e9',
                    value: 'lunch',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0ea',
                    value: 'freezable',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f0',
                    value: 'spicy',
                },
            ],
        },
    },
};

export const mockGetTagsEmpty = {
    request: {
        query: GET_TAGS,
    },
    result: {
        data: {
            tagMany: [],
        },
    },
};

export const mockGetManyTags = {
    request: {
        query: GET_TAGS,
    },
    result: {
        data: {
            tagMany: [
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                    value: 'dinner',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0e9',
                    value: 'lunch',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0ea',
                    value: 'freezable',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f0',
                    value: 'spicy',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f1',
                    value: 'vegan',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f2',
                    value: 'vegetarian',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f3',
                    value: 'gluten-free',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f4',
                    value: 'dairy-free',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f5',
                    value: 'low-carb',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f6',
                    value: 'low-fat',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f7',
                    value: 'low-sugar',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f8',
                    value: 'high-protein',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f9',
                    value: 'quick',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0fa',
                    value: 'breakfast',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0fb',
                    value: 'brunch',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0fc',
                    value: 'lunch',
                },
            ],
        },
    },
};
