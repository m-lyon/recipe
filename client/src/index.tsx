import { createRoot } from 'react-dom/client';
import { CreateRecipe } from './pages/CreateRecipe';
import { ChakraProvider } from '@chakra-ui/react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { Home } from './pages/Home';
import { ViewRecipe } from './pages/ViewRecipe';
import { Login } from './pages/Login';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { RouterProvider } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ErrorBoundary } from './pages/Error';
import { RequireAuth } from './RequireAuth';
import { Navbar } from './components/Navbar';
import { Signup } from './pages/Signup';
import { Search } from './pages/Search';
import { theme } from './theme/chakraTheme';
import { GRAPHQL_ENDPOINT } from './constants';

import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

const domNode = document.getElementById('root')!;
const root = createRoot(domNode);

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: createUploadLink({ uri: GRAPHQL_ENDPOINT, credentials: 'include' }),
});

const routes = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/recipe' errorElement={<ErrorBoundary />}>
            <Route element={<Navbar />}>
                <Route index element={<Home />} />
                <Route path='view/:titleIdentifier' element={<ViewRecipe />} />
                <Route
                    path='create'
                    element={
                        <RequireAuth>
                            <CreateRecipe />
                        </RequireAuth>
                    }
                />
            </Route>
            <Route path='login' element={<Login />} />
            <Route path='search' element={<Search />} />
            <Route path='signup' element={<Signup />} />
        </Route>
    )
);

root.render(
    <ApolloProvider client={client}>
        <ChakraProvider theme={theme}>
            <UserProvider>
                <RouterProvider router={routes} />
            </UserProvider>
        </ChakraProvider>
    </ApolloProvider>
);
