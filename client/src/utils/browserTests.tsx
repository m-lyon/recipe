import { render } from 'vitest-browser-react';
import { ChakraProvider } from '@chakra-ui/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { RouteObject, RouterProvider, createMemoryRouter } from 'react-router-dom';

import { getCache } from './cache';

export type MockedResponses = MockedResponse<Record<string, any>, Record<string, any>>[];
export function renderBrowserPage(
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
