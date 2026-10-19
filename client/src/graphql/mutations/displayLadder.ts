import { gql } from '../../__generated__';

export const CREATE_DISPLAY_LADDER = gql(`
    mutation CreateDisplayLadder($record: CreateOneDisplayLadderCreateInput!) {
        displayLadderCreateOne(record: $record) {
            record {
                ...DisplayLadderFields
            }
        }
    }
`);

export const UPDATE_DISPLAY_LADDER = gql(`
    mutation UpdateDisplayLadder($id: MongoID!, $record: UpdateByIdDisplayLadderInput!) {
        displayLadderUpdateById(_id: $id, record: $record) {
            record {
                ...DisplayLadderFields
            }
        }
    }
`);

export const REMOVE_DISPLAY_LADDER = gql(`
    mutation RemoveDisplayLadder($id: MongoID!) {
        displayLadderRemoveById(_id: $id) {
            recordId
        }
    }
`);
