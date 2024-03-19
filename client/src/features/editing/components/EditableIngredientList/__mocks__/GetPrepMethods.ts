import { GET_PREP_METHODS } from '../../../../../graphql/queries/prepMethod';

export const mockGetPrepMethods = {
    request: {
        query: GET_PREP_METHODS,
    },
    result: {
        data: {
            prepMethodMany: [
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f7',
                    value: 'chopped',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f8',
                    value: 'diced',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0fa',
                    value: 'sliced',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0fb',
                    value: 'whole',
                },
            ],
        },
    },
};
