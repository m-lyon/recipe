import { render } from 'vitest-browser-react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { RouteObject, RouterProvider, createMemoryRouter } from 'react-router-dom';

import { Provider } from '@recipe/common/components';

import { getCache } from './cache';

export type MockedResponses = MockedResponse<Record<string, any>, Record<string, any>>[];
export function renderBrowserPage(
    route: RouteObject[],
    mockedResponses: MockedResponses = [],
    initialEntries?: string[]
) {
    return render(
        <MockedProvider mocks={mockedResponses} cache={getCache()}>
            <Provider>
                <RouterProvider
                    router={createMemoryRouter(route, {
                        initialEntries,
                    })}
                />
            </Provider>
        </MockedProvider>
    );
}
