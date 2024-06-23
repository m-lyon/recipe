import { GET_TAGS } from '../tag';

export const mockDinnerTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0e8',
    value: 'dinner',
};
export const mockLunchTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0e9',
    value: 'lunch',
};
export const mockFreezableTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0ea',
    value: 'freezable',
};
export const mockSpicyTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0f0',
    value: 'spicy',
};
export const mockGlutenFreeTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0f3',
    value: 'gluten-free',
};
export const mockDairyFreeTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0f4',
    value: 'dairy-free',
};
export const mockLowCarbTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0f5',
    value: 'low-carb',
};
export const mockLowFatTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0f6',
    value: 'low-fat',
};
export const mockLowSugarTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0f7',
    value: 'low-sugar',
};
export const mockHighProteinTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0f8',
    value: 'high-protein',
};
export const mockQuickTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0f9',
    value: 'quick',
};
export const mockBreakfastTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0fa',
    value: 'breakfast',
};
export const mockBrunchTag = {
    _id: '60f4d2e5c3d5a0a4f1b9c0fb',
    value: 'brunch',
};

export const mockGetTags = {
    request: {
        query: GET_TAGS,
    },
    result: {
        data: {
            tagMany: [mockDinnerTag, mockLunchTag, mockFreezableTag, mockSpicyTag],
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
                mockDinnerTag,
                mockLunchTag,
                mockFreezableTag,
                mockSpicyTag,
                mockGlutenFreeTag,
                mockDairyFreeTag,
                mockLowCarbTag,
                mockLowFatTag,
                mockLowSugarTag,
                mockHighProteinTag,
                mockQuickTag,
                mockBreakfastTag,
                mockBrunchTag,
            ],
        },
    },
};
