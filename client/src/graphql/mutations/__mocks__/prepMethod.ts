import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

export const mockCreatePrepMethod = {
    request: {
        query: CREATE_PREP_METHOD,
        variables: {
            record: {
                value: 'pipped',
            },
        },
    },
    result: {
        data: {
            prepMethodCreateOne: {
                record: {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f7',
                    value: 'pipped',
                    owner: '60f4d2e5c3d5a0a4f1b9d0f7',
                },
            },
        },
    },
};
