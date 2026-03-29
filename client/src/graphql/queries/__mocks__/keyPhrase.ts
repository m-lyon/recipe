import { GetKeyPhrasesQuery, KeyPhraseFieldsFragment } from '@recipe/graphql/generated';
import { mockKeyPhraseId, mockKeyPhraseTwoId } from '@recipe/graphql/__mocks__/ids';

import { GET_KEY_PHRASES } from '../keyPhrase';

export const mockSearKeyPhrase: KeyPhraseFieldsFragment = {
    __typename: 'KeyPhrase',
    _id: mockKeyPhraseId,
    value: 'sear',
    description: 'To cook at high heat until a crust forms.',
};
export const mockBlanch: KeyPhraseFieldsFragment = {
    __typename: 'KeyPhrase',
    _id: mockKeyPhraseTwoId,
    value: 'blanch',
    description: 'To briefly boil then plunge into ice water.',
};

export const mockGetKeyPhrases = {
    request: {
        query: GET_KEY_PHRASES,
    },
    result: {
        data: {
            __typename: 'Query',
            keyPhraseMany: [mockSearKeyPhrase, mockBlanch],
        } satisfies GetKeyPhrasesQuery,
    },
};

export const mockGetKeyPhrasesEmpty = {
    request: {
        query: GET_KEY_PHRASES,
    },
    result: {
        data: {
            __typename: 'Query',
            keyPhraseMany: [],
        } satisfies GetKeyPhrasesQuery,
    },
};
