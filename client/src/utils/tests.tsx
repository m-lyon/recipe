import { expect } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@testing-library/user-event';
import { Screen, render } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { RouteObject, RouterProvider, createMemoryRouter } from 'react-router-dom';

import { getCache } from '@recipe/utils/cache';

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
    screen: Screen,
    user: ReturnType<typeof userEvent.setup>,
    recipeName: string,
    findText: string
) {
    await user.hover(await screen.findByLabelText(`View ${recipeName}`));
    await user.click(screen.getByLabelText(`Edit ${recipeName}`));
    expect(await screen.findByText(findText)).not.toBeNull();
}

export async function enterViewRecipePage(
    screen: Screen,
    user: ReturnType<typeof userEvent.setup>,
    recipeName: string,
    findText: string
) {
    expect(await screen.findByText('Recipes')).not.toBeNull();
    await user.click(await screen.findByLabelText(`View ${recipeName}`));
    expect(await screen.findByText(findText)).not.toBeNull();
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

export function nullByLabelText(screen: Screen, ...text: string[]) {
    for (const t of text) {
        expect(screen.queryByLabelText(t)).toBeNull();
    }
}

export async function notNullByText(screen: Screen, ...text: string[]) {
    for (const t of text) {
        expect(await screen.findByText(t)).not.toBeNull();
    }
}

export async function notNullByLabelText(screen: Screen, ...text: string[]) {
    for (const t of text) {
        expect(await screen.findByLabelText(t)).not.toBeNull();
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

export function haveTextContentByLabelText(screen: Screen, label: string, text: string) {
    expect(screen.getByLabelText(label)).property('textContent').equal(text);
}

export type MockedResponses = MockedResponse<Record<string, any>, Record<string, any>>[];
export function renderPage(
    route: RouteObject[],
    mockedResponses: MockedResponses = [],
    initialEntries?: string[]
) {
    return render(
        <MockedProvider mocks={mockedResponses} cache={getCache()}>
            <ChakraProvider>
                <RouterProvider
                    router={createMemoryRouter(route, {
                        initialEntries,
                    })}
                />
            </ChakraProvider>
        </MockedProvider>
    );
}
