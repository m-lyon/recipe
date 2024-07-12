import { gql } from '../../__generated__';

export const CREATE_TAG = gql(`
    mutation CreateTag($record: CreateOneTagInput!) {
        tagCreateOne(record: $record) {
            record {
                ...TagFields
            }
        }
    }
`);

export const REMOVE_TAG = gql(`
    mutation RemoveTag($recordId: MongoID!) {
        tagRemoveById(_id: $recordId) {
            record {
                ...TagFields
            }
        }
    }
`);
