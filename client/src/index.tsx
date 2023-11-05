import { createRoot } from 'react-dom/client';
import { CreateRecipe } from './pages/CreateRecipe';
import { ChakraProvider } from '@chakra-ui/react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { Home } from './pages/Home';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const domNode = document.getElementById('root')!;
const root = createRoot(domNode);

const client = new ApolloClient({
    uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
    cache: new InMemoryCache(),
});

root.render(
    <ApolloProvider client={client}>
        <ChakraProvider>
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/create' element={<CreateRecipe />} />
                </Routes>
            </BrowserRouter>
        </ChakraProvider>
    </ApolloProvider>
);
