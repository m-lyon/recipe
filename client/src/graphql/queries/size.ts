import { gql } from '../../__generated__';

export const SIZE_FIELDS = gql(`
    fragment SizeFields on Size {
        _id
        value
        unique
    }
`);

export const GET_EDITABLE_SIZES = gql(`
    query GetEditableSizes {
        sizeManyEditable(limit: 5000) {
            ...SizeFields
        }
    }
`);
