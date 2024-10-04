import { gql } from '../../__generated__';

export const SIZE_FIELDS = gql(`
    fragment SizeFields on Size {
        _id
        value
        unique
    }
`);

export const GET_SIZES = gql(`
    query GetSizes($filter: FilterFindManySizeInput) {
        sizeMany(limit: 5000, filter: $filter) {
            ...SizeFields
        }
    }
`);
