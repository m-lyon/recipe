import { gql } from '../../__generated__';

export const CREATE_UNIT = gql(`
    mutation CreateUnit($record: CreateOneUnitCreateInput!) {
        unitCreateOne(record: $record) {
            record {
                ...UnitFieldsFull
            }
        }
    }
`);

export const MODIFY_UNIT = gql(`
    mutation ModifyUnit($id: MongoID!, $record: UpdateByIdUnitInput!) {
        unitUpdateById(_id: $id, record: $record) {
            record {
                ...UnitFieldsFull
            }
        }
    }
`);

export const DELETE_UNIT = gql(`
    mutation DeleteUnit($id: MongoID!) {
        unitRemoveById(_id: $id) {
            recordId
        }
    }
`);
