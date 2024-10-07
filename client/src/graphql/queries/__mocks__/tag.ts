import { GetTagsQuery, Tag } from '@recipe/graphql/generated';
import { mockHighProteinTagId } from '@recipe/graphql/__mocks__/ids';
import { mockLowCarbTagId, mockSpicyTagId } from '@recipe/graphql/__mocks__/ids';
import { mockBreakfastTagId, mockBrunchTagId } from '@recipe/graphql/__mocks__/ids';
import { mockDairyFreeTagId, mockGlutenFreeTagId } from '@recipe/graphql/__mocks__/ids';
import { mockLowFatTagId, mockLowSugarTagId, mockQuickTagId } from '@recipe/graphql/__mocks__/ids';
import { mockDinnerTagId, mockFreezableTagId, mockLunchTagId } from '@recipe/graphql/__mocks__/ids';

import { GET_TAGS } from '../tag';

export const mockDinnerTag: Tag = {
    __typename: 'Tag',
    _id: mockDinnerTagId,
    value: 'dinner',
};
export const mockLunchTag: Tag = {
    __typename: 'Tag',
    _id: mockLunchTagId,
    value: 'lunch',
};
export const mockFreezableTag: Tag = {
    __typename: 'Tag',
    _id: mockFreezableTagId,
    value: 'freezable',
};
export const mockSpicyTag: Tag = {
    __typename: 'Tag',
    _id: mockSpicyTagId,
    value: 'spicy',
};
export const mockGlutenFreeTag: Tag = {
    __typename: 'Tag',
    _id: mockGlutenFreeTagId,
    value: 'gluten-free',
};
export const mockDairyFreeTag: Tag = {
    __typename: 'Tag',
    _id: mockDairyFreeTagId,
    value: 'dairy-free',
};
export const mockLowCarbTag: Tag = {
    __typename: 'Tag',
    _id: mockLowCarbTagId,
    value: 'low-carb',
};
export const mockLowFatTag: Tag = {
    __typename: 'Tag',
    _id: mockLowFatTagId,
    value: 'low-fat',
};
export const mockLowSugarTag: Tag = {
    __typename: 'Tag',
    _id: mockLowSugarTagId,
    value: 'low-sugar',
};
export const mockHighProteinTag: Tag = {
    __typename: 'Tag',
    _id: mockHighProteinTagId,
    value: 'high-protein',
};
export const mockQuickTag: Tag = {
    __typename: 'Tag',
    _id: mockQuickTagId,
    value: 'quick',
};
export const mockBreakfastTag: Tag = {
    __typename: 'Tag',
    _id: mockBreakfastTagId,
    value: 'breakfast',
};
export const mockBrunchTag: Tag = {
    __typename: 'Tag',
    _id: mockBrunchTagId,
    value: 'brunch',
};

export const mockGetTags = {
    request: {
        query: GET_TAGS,
    },
    result: {
        data: {
            __typename: 'Query',
            tagMany: [mockDinnerTag, mockLunchTag, mockFreezableTag, mockSpicyTag],
        } satisfies GetTagsQuery,
    },
};

export const mockGetTagsEmpty = {
    request: {
        query: GET_TAGS,
    },
    result: {
        data: {
            __typename: 'Query',
            tagMany: [],
        } satisfies GetTagsQuery,
    },
};

export const mockGetManyTags = {
    request: {
        query: GET_TAGS,
    },
    result: {
        data: {
            __typename: 'Query',
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
        } satisfies GetTagsQuery,
    },
};
