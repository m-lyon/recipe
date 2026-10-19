import { Route, createRoutesFromElements } from 'react-router-dom';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetDisplayLadders } from '@recipe/graphql/queries/__mocks__/displayLadder';

import { EditableIngredient } from '../EditableIngredient';

export const renderComponent = (mockedResponses: MockedResponses = []) => {
    const routes = createRoutesFromElements(
        <Route path='/' element={<EditableIngredient section={0} />} />
    );
    return renderPage(routes, [
        mockGetIngredientComponents,
        mockGetDisplayLadders,
        ...mockedResponses,
    ]);
};
