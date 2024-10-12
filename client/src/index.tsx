import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

import { getCache } from '@recipe/utils/cache';
import { GRAPHQL_URL } from '@recipe/constants';

import { routes } from './routes';
import { theme } from './theme/chakraTheme';

const domNode = document.getElementById('root')!;
const root = createRoot(domNode);

const client = new ApolloClient({
    cache: getCache(),
    link: createUploadLink({ uri: GRAPHQL_URL, credentials: 'include' }),
});

root.render(
    <ApolloProvider client={client}>
        <ChakraProvider theme={theme}>
            <RouterProvider router={createBrowserRouter(routes)} />
        </ChakraProvider>
    </ApolloProvider>
);
