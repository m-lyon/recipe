import { mockSearKeyPhrase } from '@recipe/graphql/queries/__mocks__/keyPhrase';
import { CreateKeyPhraseMutation } from '@recipe/graphql/generated';
import { CreateKeyPhraseMutationVariables } from '@recipe/graphql/generated';
import { UpdateKeyPhraseMutation } from '@recipe/graphql/generated';
import { UpdateKeyPhraseMutationVariables } from '@recipe/graphql/generated';
import { RemoveKeyPhraseMutation } from '@recipe/graphql/generated';
import { RemoveKeyPhraseMutationVariables } from '@recipe/graphql/generated';
import { KeyPhraseUsedInRecipesQuery } from '@recipe/graphql/generated';
import { KeyPhraseUsedInRecipesQueryVariables } from '@recipe/graphql/generated';
import { CREATE_KEY_PHRASE, UPDATE_KEY_PHRASE, REMOVE_KEY_PHRASE } from '@recipe/graphql/mutations/keyPhrase';
import { KEY_PHRASE_USED_IN_RECIPES } from '@recipe/graphql/queries/keyPhrase';

export const mockCreateKeyPhrase = {
    request: {
        query: CREATE_KEY_PHRASE,
        variables: {
            record: {
                value: mockSearKeyPhrase.value,
                description: mockSearKeyPhrase.description,
            },
        } satisfies CreateKeyPhraseMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            keyPhraseCreateOne: {
                __typename: 'CreateOneKeyPhrasePayload',
                record: mockSearKeyPhrase,
            },
        } satisfies CreateKeyPhraseMutation,
    },
};

export const mockUpdateKeyPhrase = {
    request: {
        query: UPDATE_KEY_PHRASE,
        variables: {
            _id: mockSearKeyPhrase._id,
            record: {
                value: 'seared',
                description: 'Updated description.',
            },
        } satisfies UpdateKeyPhraseMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            keyPhraseUpdateById: {
                __typename: 'UpdateByIdKeyPhrasePayload',
                record: {
                    ...mockSearKeyPhrase,
                    value: 'seared',
                    description: 'Updated description.',
                },
            },
        } satisfies UpdateKeyPhraseMutation,
    },
};

export const mockDeleteKeyPhrase = {
    request: {
        query: REMOVE_KEY_PHRASE,
        variables: {
            recordId: mockSearKeyPhrase._id,
        } satisfies RemoveKeyPhraseMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            keyPhraseRemoveById: {
                __typename: 'RemoveByIdKeyPhrasePayload',
                record: mockSearKeyPhrase,
            },
        } satisfies RemoveKeyPhraseMutation,
    },
};

export const mockKeyPhraseUsedInRecipes = {
    request: {
        query: KEY_PHRASE_USED_IN_RECIPES,
        variables: {
            value: mockSearKeyPhrase.value,
        } satisfies KeyPhraseUsedInRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            keyPhraseUsedInRecipes: true,
        } satisfies KeyPhraseUsedInRecipesQuery,
    },
};

export const mockKeyPhraseNotUsedInRecipes = {
    request: {
        query: KEY_PHRASE_USED_IN_RECIPES,
        variables: {
            value: mockSearKeyPhrase.value,
        } satisfies KeyPhraseUsedInRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            keyPhraseUsedInRecipes: false,
        } satisfies KeyPhraseUsedInRecipesQuery,
    },
};
