import { gql } from '../../__generated__/gql';

export const CREATE_PREP_METHOD = gql(`
    mutation CreatePrepMethod($record: CreateOnePrepMethodInput!) {
        prepMethodCreateOne(record: $record) {
            record {
                _id
                value
            }
        }
    }
`);