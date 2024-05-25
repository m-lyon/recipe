import { CREATE_UNIT } from '@recipe/graphql/mutations/unit';

export const mockCreateUnit = {
    request: {
        query: CREATE_UNIT,
        variables: {
            record: {
                longSingular: 'cutting',
                longPlural: 'cutting',
                shortSingular: 'cut',
                shortPlural: 'cut',
                preferredNumberFormat: 'decimal',
                hasSpace: true,
            },
        },
    },
    result: {
        data: {
            unitCreateOne: {
                record: {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f7',
                    longSingular: 'cutting',
                    longPlural: 'cutting',
                    shortSingular: 'cut',
                    shortPlural: 'cut',
                    preferredNumberFormat: 'decimal',
                    hasSpace: true,
                },
            },
        },
    },
};
