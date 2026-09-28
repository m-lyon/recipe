import { mockOunce } from '@recipe/graphql/queries/__mocks__/unit';
import { mockUnitConversionIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockConversionRuleIdNew } from '@recipe/graphql/__mocks__/ids';
import { CreateConversionRuleMutation } from '@recipe/graphql/generated';
import { RemoveConversionRuleMutation } from '@recipe/graphql/generated';
import { RemoveUnitConversionMutation } from '@recipe/graphql/generated';
import { UpdateUnitConversionMutation } from '@recipe/graphql/generated';
import { CREATE_CONVERSION_RULE } from '@recipe/graphql/mutations/unitConversion';
import { REMOVE_CONVERSION_RULE } from '@recipe/graphql/mutations/unitConversion';
import { REMOVE_UNIT_CONVERSION } from '@recipe/graphql/mutations/unitConversion';
import { UPDATE_UNIT_CONVERSION } from '@recipe/graphql/mutations/unitConversion';
import { CreateConversionRuleMutationVariables } from '@recipe/graphql/generated';
import { RemoveConversionRuleMutationVariables } from '@recipe/graphql/generated';
import { RemoveUnitConversionMutationVariables } from '@recipe/graphql/generated';
import { UpdateUnitConversionMutationVariables } from '@recipe/graphql/generated';
import { mockUnitConversionOne } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockUnitConversionTwo } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockConversionRuleThree } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockConversionRuleIdOne, mockConversionRuleIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockConversionRuleIdThree, mockUnitConversionIdOne } from '@recipe/graphql/__mocks__/ids';

// Adds a "1 oz = 28 g, g >= 28" rule to the gram conversion
export const mockCreateConversionRuleOunce = {
    request: {
        query: CREATE_CONVERSION_RULE,
        variables: {
            record: {
                baseUnitThreshold: 28,
                unit: mockOunce._id,
                baseUnit: mockUnitConversionOne.baseUnit._id,
                baseToUnitConversion: 28,
            },
        } satisfies CreateConversionRuleMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            conversionRuleCreateOne: {
                __typename: 'CreateOneConversionRulePayload',
                record: {
                    __typename: 'ConversionRule',
                    _id: mockConversionRuleIdNew,
                    baseUnitThreshold: 28,
                    baseToUnitConversion: 28,
                    unit: mockOunce,
                },
            },
        } satisfies CreateConversionRuleMutation,
    },
};

export const mockUpdateUnitConversionAddRule = {
    request: {
        query: UPDATE_UNIT_CONVERSION,
        variables: {
            id: mockUnitConversionIdOne,
            record: { rules: [mockConversionRuleIdOne, mockConversionRuleIdNew] },
        } satisfies UpdateUnitConversionMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            unitConversionUpdateById: {
                __typename: 'UpdateByIdUnitConversionPayload',
                record: {
                    ...mockUnitConversionOne,
                    rules: [
                        ...mockUnitConversionOne.rules,
                        mockCreateConversionRuleOunce.result.data.conversionRuleCreateOne.record,
                    ],
                },
            },
        } satisfies UpdateUnitConversionMutation,
    },
};

// Removes the tbsp rule from the tsp conversion, leaving the cup rule
export const mockUpdateUnitConversionRemoveRule = {
    request: {
        query: UPDATE_UNIT_CONVERSION,
        variables: {
            id: mockUnitConversionIdTwo,
            record: { rules: [mockConversionRuleIdThree] },
        } satisfies UpdateUnitConversionMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            unitConversionUpdateById: {
                __typename: 'UpdateByIdUnitConversionPayload',
                record: { ...mockUnitConversionTwo, rules: [mockConversionRuleThree] },
            },
        } satisfies UpdateUnitConversionMutation,
    },
};

export const mockRemoveConversionRuleTwo = {
    request: {
        query: REMOVE_CONVERSION_RULE,
        variables: { id: mockConversionRuleIdTwo } satisfies RemoveConversionRuleMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            conversionRuleRemoveById: {
                __typename: 'RemoveByIdConversionRulePayload',
                recordId: mockConversionRuleIdTwo,
            },
        } satisfies RemoveConversionRuleMutation,
    },
};

export const mockRemoveConversionRuleOne = {
    request: {
        query: REMOVE_CONVERSION_RULE,
        variables: { id: mockConversionRuleIdOne } satisfies RemoveConversionRuleMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            conversionRuleRemoveById: {
                __typename: 'RemoveByIdConversionRulePayload',
                recordId: mockConversionRuleIdOne,
            },
        } satisfies RemoveConversionRuleMutation,
    },
};

export const mockRemoveUnitConversionOne = {
    request: {
        query: REMOVE_UNIT_CONVERSION,
        variables: { id: mockUnitConversionIdOne } satisfies RemoveUnitConversionMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            unitConversionRemoveById: {
                __typename: 'RemoveByIdUnitConversionPayload',
                recordId: mockUnitConversionIdOne,
            },
        } satisfies RemoveUnitConversionMutation,
    },
};
