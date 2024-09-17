import { gql } from '../../__generated__';

export const SIZE_FIELDS = gql(`
    fragment SizeFields on Size {
        _id
        value
        unique
    }
`);

export const SIZE_FIELDS_FULL = gql(`
    fragment SizeFieldsFull on Size {
        ...SizeFields
        owner
    }
`);

export const GET_SIZES = gql(`
    query GetSizes($filter: FilterFindManySizeInput) {
        sizeMany(limit: 5000, filter: $filter) {
            ...SizeFieldsFull
        }
    }
`);
