import { gql } from '../../__generated__';

export const TAG_FIELDS = gql(`
    fragment TagFields on Tag {
        _id
        value
    }
`);

export const GET_TAGS = gql(`
    query GetTags {
        tagMany {
            ...TagFields
        }
    }
`);
