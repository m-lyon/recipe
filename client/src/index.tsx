import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ChakraProvider } from '@chakra-ui/react';
import { Notifications } from '@mantine/notifications';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { theme } from '@recipe/utils/theme';
import { getCache } from '@recipe/utils/cache';
import { GRAPHQL_URL } from '@recipe/constants';

import { routes } from './routes';

const domNode = document.getElementById('root')!;
const root = createRoot(domNode);

const client = new ApolloClient({
    cache: getCache(),
    link: createUploadLink({ uri: GRAPHQL_URL, credentials: 'include' }),
});

root.render(
    <ApolloProvider client={client}>
        <MantineProvider theme={theme}>
            <Notifications />
            <ChakraProvider>
                <RouterProvider router={createBrowserRouter(routes)} />
            </ChakraProvider>
        </MantineProvider>
    </ApolloProvider>
);
