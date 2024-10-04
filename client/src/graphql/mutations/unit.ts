import { gql } from '../../__generated__';

export const CREATE_UNIT = gql(`
    mutation CreateUnit($record: CreateOneUnitCreateInput!) {
        unitCreateOne(record: $record) {
            record {
                ...UnitFields
            }
        }
    }
`);

export const MODIFY_UNIT = gql(`
    mutation ModifyUnit($id: MongoID!, $record: UpdateByIdUnitInput!) {
        unitUpdateById(_id: $id, record: $record) {
            record {
                ...UnitFields
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
