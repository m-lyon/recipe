import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { PrepMethodCreateOneId, mockAdminId } from '@recipe/graphql/__mocks__/ids';

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
                    _id: PrepMethodCreateOneId,
                    value: 'pipped',
                    owner: mockAdminId,
                },
            },
        },
    },
};
