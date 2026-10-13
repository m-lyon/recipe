import { Size } from '@recipe/graphql/schema';
import { GetEditableSizesQuery } from '@recipe/graphql/generated';
import { mockAdminId, mockLargeId, mockMediumId, mockSmallId } from '@recipe/graphql/__mocks__/ids';

import { GET_EDITABLE_SIZES } from '../size';

export const mockSmall: Size = {
    __typename: 'Size',
    _id: mockSmallId,
    value: 'small',
    unique: true,
    owner: mockAdminId,
};
export const mockMedium: Size = {
    __typename: 'Size',
    _id: mockMediumId,
    value: 'medium',
    unique: true,
    owner: mockAdminId,
};
export const mockLarge: Size = {
    __typename: 'Size',
    _id: mockLargeId,
    value: 'large',
    unique: true,
    owner: mockAdminId,
};
export const mockSizes = [mockSmall, mockMedium, mockLarge];

export const mockGetEditableSizes = {
    request: { query: GET_EDITABLE_SIZES },
    result: {
        data: { __typename: 'Query', sizeManyEditable: mockSizes } satisfies GetEditableSizesQuery,
    },
};
