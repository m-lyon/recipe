import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ChakraProvider } from '@chakra-ui/react';
import { Notifications } from '@mantine/notifications';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { theme } from '@recipe/theme';
import { getCache } from '@recipe/utils/cache';
import { getIsStandalone } from '@recipe/common/hooks';
import { DELAY_LONG, GRAPHQL_URL } from '@recipe/constants';
import { getRestorableRoute, saveLastRoute } from '@recipe/utils/lastRoute';

import { routes } from './routes';

// An installed PWA relaunches at its start_url after the OS kills it, so go back to the
// route the user was on. This must happen before the router reads the URL.
if (getIsStandalone()) {
    const restored = getRestorableRoute(window.location);
    if (restored) {
        window.history.replaceState(null, '', restored);
    }
}
const router = createBrowserRouter(routes);
saveLastRoute(router.state.location);
router.subscribe((state) => saveLastRoute(state.location));

const domNode = document.getElementById('root')!;
const root = createRoot(domNode);

const client = new ApolloClient({
    cache: getCache(),
    link: createUploadLink({ uri: GRAPHQL_URL, credentials: 'include' }),
});

root.render(
    <ApolloProvider client={client}>
        <MantineProvider theme={theme}>
            <Notifications autoClose={DELAY_LONG} />
            <ChakraProvider>
                {/* Keep react-router 6 behaviour: v7 wraps every navigation in startTransition */}
                <RouterProvider router={router} useTransitions={false} />
            </ChakraProvider>
        </MantineProvider>
    </ApolloProvider>
);
