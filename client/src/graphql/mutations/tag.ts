import { gql } from '../../__generated__';

export const CREATE_TAG = gql(`
    mutation CreateTag($record: CreateOneTagInput!) {
        tagCreateOne(record: $record) {
            record {
                _id
                value
            }
        }
    }
`);
