import { gql } from '../../__generated__';

export const KEY_PHRASE_FIELDS = gql(`
    fragment KeyPhraseFields on KeyPhrase {
        _id
        value
        description
    }
`);

export const GET_KEY_PHRASES = gql(`
    query GetKeyPhrases {
        keyPhraseMany {
            ...KeyPhraseFields
        }
    }
`);

export const KEY_PHRASE_USED_IN_RECIPES = gql(`
    query KeyPhraseUsedInRecipes($value: String!) {
        keyPhraseUsedInRecipes(value: $value)
    }
`);
