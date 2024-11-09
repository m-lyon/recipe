import { expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { Screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@vitest/browser/context';
import { MockedProvider } from '@apollo/client/testing';
import { RouteObject, RouterProvider, createMemoryRouter } from 'react-router-dom';

import { getCache } from '@recipe/utils/cache';

import { MockedResponses } from './tests';

export async function enterEditRecipePage(
    screen: Screen,
    user: ReturnType<typeof userEvent.setup>,
    recipeName: string,
    findText: string
) {
    await user.hover(await screen.findByText(recipeName), { force: true });
    await user.click(screen.getByLabelText(`Edit ${recipeName}`));
    expect(await screen.findByText(findText)).not.toBeNull();
}

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
