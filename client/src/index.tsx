import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { Navbar } from '@recipe/features/navbar';
import { GRAPHQL_ENDPOINT, ROOT_PATH } from '@recipe/constants';
import { RequireAuth, UserProvider } from '@recipe/features/user';

import { CreateUnit } from 'pages/CreateUnit';
import { CreateIngredient } from 'pages/CreateIngredient';
import { CreatePrepMethod } from 'pages/CreatePrepMethod';

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
import { EditIngredient } from './pages/EditIngredient';
import { EditPrepMethod } from './pages/EditPrepMethod';
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
                <Route path='view'>
                    <Route path='recipe/:titleIdentifier' element={<ViewRecipe />} />
                </Route>
                <Route path='create' element={<RequireAuth />}>
                    <Route path='recipe' element={<CreateRecipe />} />
                    <Route path='unit' element={<CreateUnit />} />
                    <Route path='unit-conversion' element={<CreateUnitConversion />} />
                    <Route path='ingredient' element={<CreateIngredient />} />
                    <Route path='prep-method' element={<CreatePrepMethod />} />
                </Route>
                <Route path='edit' element={<RequireAuth />}>
                    <Route path='unit' element={<EditUnit />} />
                    <Route path='ingredient' element={<EditIngredient />} />
                    <Route path='prep-method' element={<EditPrepMethod />} />
                    <Route path='recipe/:titleIdentifier' element={<EditRecipe />} />
                </Route>
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
