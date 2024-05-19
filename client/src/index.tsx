import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { CreateUnitConversion } from 'pages/CreateUnitConversion';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Search } from './pages/Search';
import { RequireAuth } from './RequireAuth';
import { theme } from './theme/chakraTheme';
import { Navbar } from './components/Navbar';
import { ErrorBoundary } from './pages/Error';
import { ViewRecipe } from './pages/ViewRecipe';
import { EditRecipe } from './pages/EditRecipe';
import { CreateRecipe } from './pages/CreateRecipe';
import { UserProvider } from './context/UserContext';
import { GRAPHQL_ENDPOINT, ROOT_PATH } from './constants';

const domNode = document.getElementById('root')!;
const root = createRoot(domNode);

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: createUploadLink({ uri: GRAPHQL_ENDPOINT, credentials: 'include' }),
});

const routes = createBrowserRouter(
    createRoutesFromElements(
        <Route path={ROOT_PATH} errorElement={<ErrorBoundary />}>
            <Route element={<Navbar />}>
                <Route index element={<Home />} />
                <Route path='view/:titleIdentifier' element={<ViewRecipe />} />
                <Route
                    path='create/recipe'
                    element={
                        <RequireAuth>
                            <CreateRecipe />
                        </RequireAuth>
                    }
                />
                <Route path='create/unit-conversion' element={<CreateUnitConversion />} />
                <Route
                    path='edit/:titleIdentifier'
                    element={
                        <RequireAuth>
                            <EditRecipe />
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
