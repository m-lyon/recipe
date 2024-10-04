import { gql } from '../../__generated__';

export const CREATE_SIZE = gql(`
    mutation CreateSize($record: CreateOneSizeCreateInput!) {
        sizeCreateOne(record: $record) {
            record {
                ...SizeFields
            }
        }
    }
`);

export const MODIFY_SIZE = gql(`
    mutation ModifySize($id: MongoID!, $record: UpdateByIdSizeInput!) {
        sizeUpdateById(_id: $id, record: $record) {
            record {
                ...SizeFields
            }
        }
    }
`);

export const DELETE_SIZE = gql(`
    mutation DeleteSize($id: MongoID!) {
        sizeRemoveById(_id: $id) {
            recordId
        }
    }
`);
