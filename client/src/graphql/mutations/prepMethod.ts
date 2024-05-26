import { gql } from '../../__generated__';

export const CREATE_PREP_METHOD = gql(`
    mutation CreatePrepMethod($record: CreateOnePrepMethodCreateInput!) {
        prepMethodCreateOne(record: $record) {
            record {
                _id
                value
            }
        }
    }
`);

export const MODIFY_PREP_METHOD = gql(`
    mutation ModifyPrepMethod($id: MongoID!, $record: UpdateByIdPrepMethodInput!) {
        prepMethodUpdateById(_id: $id, record: $record) {
            record {
                _id
                value
            }
        }
    }
`);

export const DELETE_PREP_METHOD = gql(`
    mutation DeletePrepMethod($id: MongoID!) {
        prepMethodRemoveById(_id: $id) {
            recordId
        }
    }
`);
