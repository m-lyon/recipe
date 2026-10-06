import { gql } from '../../__generated__';

export const DISPLAY_LADDER_FIELDS = gql(`
    fragment DisplayLadderFields on DisplayLadder {
        _id
        name
        dimension
        system
        scope
        owner
        steps {
            minCanonical
            unit {
                ...UnitFields
            }
        }
    }
`);

export const GET_DISPLAY_LADDERS = gql(`
    query GetDisplayLadders {
        displayLadderMany(limit: 5000) {
            ...DisplayLadderFields
        }
    }
`);
