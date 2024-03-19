import { gql } from '../../__generated__/gql';

export const GET_TAGS = gql(`
    query GetTags {
        tagMany {
            _id
            value
        }
    }
`);