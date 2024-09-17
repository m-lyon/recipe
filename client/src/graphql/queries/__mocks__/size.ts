import { mockAdminId, mockLargeId, mockMediumId, mockSmallId } from '@recipe/graphql/__mocks__/ids';

export const mockSmall = {
    __typename: 'Size' as const,
    _id: mockSmallId,
    value: 'small',
    unique: true,
    owner: mockAdminId,
};
export const mockMedium = {
    __typename: 'Size' as const,
    _id: mockMediumId,
    value: 'medium',
    unique: true,
    owner: mockAdminId,
};
export const mockLarge = {
    __typename: 'Size' as const,
    _id: mockLargeId,
    value: 'large',
    unique: true,
    owner: mockAdminId,
};
export const mockSizes = [mockSmall, mockMedium, mockLarge];
