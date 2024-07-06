import { mockHighProteinTagId } from '@recipe/graphql/__mocks__/ids';
import { mockLowCarbTagId, mockSpicyTagId } from '@recipe/graphql/__mocks__/ids';
import { mockBreakfastTagId, mockBrunchTagId } from '@recipe/graphql/__mocks__/ids';
import { mockDairyFreeTagId, mockGlutenFreeTagId } from '@recipe/graphql/__mocks__/ids';
import { mockLowFatTagId, mockLowSugarTagId, mockQuickTagId } from '@recipe/graphql/__mocks__/ids';
import { mockDinnerTagId, mockFreezableTagId, mockLunchTagId } from '@recipe/graphql/__mocks__/ids';

import { GET_TAGS } from '../tag';

export const mockDinnerTag = {
    __typename: 'Tag' as const,
    _id: mockDinnerTagId,
    value: 'dinner',
};
export const mockLunchTag = {
    __typename: 'Tag' as const,
    _id: mockLunchTagId,
    value: 'lunch',
};
export const mockFreezableTag = {
    __typename: 'Tag' as const,
    _id: mockFreezableTagId,
    value: 'freezable',
};
export const mockSpicyTag = {
    __typename: 'Tag' as const,
    _id: mockSpicyTagId,
    value: 'spicy',
};
export const mockGlutenFreeTag = {
    __typename: 'Tag' as const,
    _id: mockGlutenFreeTagId,
    value: 'gluten-free',
};
export const mockDairyFreeTag = {
    __typename: 'Tag' as const,
    _id: mockDairyFreeTagId,
    value: 'dairy-free',
};
export const mockLowCarbTag = {
    __typename: 'Tag' as const,
    _id: mockLowCarbTagId,
    value: 'low-carb',
};
export const mockLowFatTag = {
    __typename: 'Tag' as const,
    _id: mockLowFatTagId,
    value: 'low-fat',
};
export const mockLowSugarTag = {
    __typename: 'Tag' as const,
    _id: mockLowSugarTagId,
    value: 'low-sugar',
};
export const mockHighProteinTag = {
    __typename: 'Tag' as const,
    _id: mockHighProteinTagId,
    value: 'high-protein',
};
export const mockQuickTag = {
    __typename: 'Tag' as const,
    _id: mockQuickTagId,
    value: 'quick',
};
export const mockBreakfastTag = {
    __typename: 'Tag' as const,
    _id: mockBreakfastTagId,
    value: 'breakfast',
};
export const mockBrunchTag = {
    __typename: 'Tag' as const,
    _id: mockBrunchTagId,
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
