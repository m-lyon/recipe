import { gql } from '../../__generated__';

export const CREATE_KEY_PHRASE = gql(`
    mutation CreateKeyPhrase($record: CreateOneKeyPhraseInput!) {
        keyPhraseCreateOne(record: $record) {
            record {
                ...KeyPhraseFields
            }
        }
    }
`);

export const UPDATE_KEY_PHRASE = gql(`
    mutation UpdateKeyPhrase($_id: MongoID!, $record: UpdateByIdKeyPhraseInput!) {
        keyPhraseUpdateById(_id: $_id, record: $record) {
            record {
                ...KeyPhraseFields
            }
        }
    }
`);

export const REMOVE_KEY_PHRASE = gql(`
    mutation RemoveKeyPhrase($recordId: MongoID!) {
        keyPhraseRemoveById(_id: $recordId) {
            record {
                ...KeyPhraseFields
            }
        }
    }
`);
