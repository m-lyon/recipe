import { GetSizesQuery, GetSizesQueryVariables, Size } from '@recipe/graphql/generated';
import { mockAdminId, mockLargeId, mockMediumId, mockSmallId } from '@recipe/graphql/__mocks__/ids';

import { GET_SIZES } from '../size';

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

export const mockGetSizes = {
    request: { query: GET_SIZES, variables: { filter: {} } satisfies GetSizesQueryVariables },
    result: { data: { __typename: 'Query', sizeMany: mockSizes } satisfies GetSizesQuery },
};
