import { mockAdminId } from '@recipe/graphql/__mocks__/ids';
import { GetDisplayLaddersQuery } from '@recipe/graphql/generated';
import { mockUsVolumeLadderId } from '@recipe/graphql/__mocks__/ids';
import { mockMetricMassLadderId, mockMetricVolumeLadderId } from '@recipe/graphql/__mocks__/ids';

import { mockTablespoon, mockTeaspoon } from './unit';
import { GET_DISPLAY_LADDERS } from '../displayLadder';
import { mockCup, mockGram, mockKilogram, mockMilliliter } from './unit';

type Ladder = GetDisplayLaddersQuery['displayLadderMany'][number];

export const mockMetricMassLadder: Ladder = {
    __typename: 'DisplayLadder',
    _id: mockMetricMassLadderId,
    name: 'metric-mass',
    dimension: 'mass',
    system: 'metric',
    scope: 'global',
    owner: mockAdminId,
    steps: [
        { __typename: 'DisplayLadderSteps', minCanonical: 1000, unit: mockKilogram },
        { __typename: 'DisplayLadderSteps', minCanonical: 0, unit: mockGram },
    ],
};
// Thresholds match the old teaspoon group: a cup from 12 tsp, a tablespoon from 3 tsp.
export const mockUsVolumeLadder: Ladder = {
    __typename: 'DisplayLadder',
    _id: mockUsVolumeLadderId,
    name: 'us-volume',
    dimension: 'volume',
    system: 'us',
    scope: 'global',
    owner: mockAdminId,
    steps: [
        { __typename: 'DisplayLadderSteps', minCanonical: 59.147059125, unit: mockCup },
        { __typename: 'DisplayLadderSteps', minCanonical: 14.78676478125, unit: mockTablespoon },
        { __typename: 'DisplayLadderSteps', minCanonical: 0, unit: mockTeaspoon },
    ],
};
export const mockMetricVolumeLadder: Ladder = {
    __typename: 'DisplayLadder',
    _id: mockMetricVolumeLadderId,
    name: 'metric-volume',
    dimension: 'volume',
    system: 'metric',
    scope: 'global',
    owner: mockAdminId,
    steps: [{ __typename: 'DisplayLadderSteps', minCanonical: 0, unit: mockMilliliter }],
};
export const mockLadders = [mockMetricMassLadder, mockUsVolumeLadder, mockMetricVolumeLadder];

export const mockGetDisplayLadders = {
    request: { query: GET_DISPLAY_LADDERS },
    result: {
        data: {
            __typename: 'Query',
            displayLadderMany: mockLadders,
        } satisfies GetDisplayLaddersQuery,
    },
};
