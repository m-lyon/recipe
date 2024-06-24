import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { getCache } from '@recipe/utils/cache';
import { GRAPHQL_ENDPOINT } from '@recipe/constants';
import { UserProvider } from '@recipe/features/user';

import { routes } from './routes';
import { theme } from './theme/chakraTheme';

const domNode = document.getElementById('root')!;
const root = createRoot(domNode);

const client = new ApolloClient({
    cache: getCache(),
    link: createUploadLink({ uri: GRAPHQL_ENDPOINT, credentials: 'include' }),
});

root.render(
    <ApolloProvider client={client}>
        <ChakraProvider theme={theme}>
            <UserProvider>
                <RouterProvider router={createBrowserRouter(routes)} />
            </UserProvider>
        </ChakraProvider>
    </ApolloProvider>
);
