import { GET_TAGS } from '../TagDropdown';

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
