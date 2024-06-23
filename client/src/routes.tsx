import { Route, createRoutesFromElements } from 'react-router-dom';

import { ROOT_PATH } from '@recipe/constants';
import { Navbar } from '@recipe/features/navbar';
import { RequireAuth } from '@recipe/features/user';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Search } from './pages/Search';
import { EditUnit } from './pages/EditUnit';
import { ErrorBoundary } from './pages/Error';
import { ViewRecipe } from './pages/ViewRecipe';
import { EditRecipe } from './pages/EditRecipe';
import { CreateUnit } from './pages/CreateUnit';
import { CreateRecipe } from './pages/CreateRecipe';
import { EditIngredient } from './pages/EditIngredient';
import { EditPrepMethod } from './pages/EditPrepMethod';
import { CreateIngredient } from './pages/CreateIngredient';
import { CreatePrepMethod } from './pages/CreatePrepMethod';
import { CreateUnitConversion } from './pages/CreateUnitConversion';

export const routes = createRoutesFromElements(
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
);
