import { expect } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@testing-library/user-event';
import { Screen, render } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { RouteObject, RouterProvider, createMemoryRouter } from 'react-router-dom';

import { getCache } from '@recipe/utils/cache';
import { UserProvider } from '@recipe/features/user';

export async function enterCreateNewRecipePage(
    screen: Screen,
    user: ReturnType<typeof userEvent.setup>
) {
    expect(await screen.findByText('Recipes'));
    expect(await screen.findByText('Logout'));
    await user.click(screen.getAllByLabelText('Create new recipe')[0]);
    expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
}

export async function enterEditRecipePage(
    recipeName: string,
    instructionText: string,
    screen: Screen,
    user: ReturnType<typeof userEvent.setup>
) {
    await user.hover(await screen.findByLabelText(`View ${recipeName}`));
    await user.click(screen.getByLabelText(`Edit ${recipeName}`));
    expect(await screen.findByText(instructionText)).not.toBeNull();
}

export async function clickFindByText(
    screen: Screen,
    user: ReturnType<typeof userEvent.setup>,
    ...text: string[]
) {
    for (const t of text) {
        await user.click(await screen.findByText(t));
    }
}

export async function clickGetByText(
    screen: Screen,
    user: ReturnType<typeof userEvent.setup>,
    ...text: string[]
) {
    for (const t of text) {
        await user.click(screen.getByText(t));
    }
}

export function nullByText(screen: Screen, ...text: string[]) {
    for (const t of text) {
        expect(screen.queryByText(t)).toBeNull();
    }
}

export async function notNullByText(screen: Screen, ...text: string[]) {
    expect(await screen.findByText(text[0])).not.toBeNull();
    if (text.length === 1) {
        return;
    }
    for (const t of text.slice(1)) {
        expect(screen.queryByText(t)).not.toBeNull();
    }
}

export function allNotNullByText(screen: Screen, ...text: string[]) {
    for (const t of text) {
        expect(screen.queryAllByText(t)).not.toBeNull();
    }
}

export function haveValueByLabelText(screen: Screen, label: string, value: string) {
    expect(screen.getByLabelText(label)).property('value').equal(value);
}

export type MockedResponses = MockedResponse<Record<string, any>, Record<string, any>>[];
export function renderPage(
    route: RouteObject[],
    mockedResponses: MockedResponses = [],
    initialEntries?: string[]
) {
    render(
        <MockedProvider mocks={mockedResponses} cache={getCache()}>
            <ChakraProvider>
                <UserProvider>
                    <RouterProvider
                        router={createMemoryRouter(route, {
                            initialEntries,
                        })}
                    />
                </UserProvider>
            </ChakraProvider>
        </MockedProvider>
    );
}
