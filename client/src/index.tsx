import { createRoot } from 'react-dom/client';
import { CreateRecipePage } from './pages/CreateRecipePage';
import { ChakraProvider } from '@chakra-ui/react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const domNode = document.getElementById('root')!;
const root = createRoot(domNode);

const client = new ApolloClient({
    uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
    cache: new InMemoryCache(),
});

root.render(
    <ApolloProvider client={client}>
        <ChakraProvider>
            <CreateRecipePage />
        </ChakraProvider>
    </ApolloProvider>
);
