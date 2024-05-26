import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { Navbar } from '@recipe/features/navbar';
import { RequireAuth, UserProvider } from '@recipe/features/user';
import { GRAPHQL_ENDPOINT, ROOT_PATH } from '@recipe/constants';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Search } from './pages/Search';
import { theme } from './theme/chakraTheme';
import { EditUnit } from './pages/EditUnit';
import { ErrorBoundary } from './pages/Error';
import { ViewRecipe } from './pages/ViewRecipe';
import { EditRecipe } from './pages/EditRecipe';
import { CreateRecipe } from './pages/CreateRecipe';
import { CreateUnitConversion } from './pages/CreateUnitConversion';

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
                <Route path='view/recipe/:titleIdentifier' element={<ViewRecipe />} />
                <Route
                    path='create/recipe'
                    element={
                        <RequireAuth>
                            <CreateRecipe />
                        </RequireAuth>
                    }
                />
                <Route path='edit/unit' element={<EditUnit />} />
                <Route path='create/unit-conversion' element={<CreateUnitConversion />} />
                <Route
                    path='edit/recipe/:titleIdentifier'
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
