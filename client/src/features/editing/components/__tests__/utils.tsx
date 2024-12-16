import { Route, createRoutesFromElements } from 'react-router-dom';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { EditableIngredientSubsections } from '../EditableIngredientSubsections';

export const renderComponent = (mockedResponses: MockedResponses = []) => {
    const MockEditableIngredientList = () => {
        return <EditableIngredientSubsections />;
    };
    const routes = createRoutesFromElements(
        <Route path='/' element={<MockEditableIngredientList />} />
    );
    return renderPage(routes, [
        mockGetIngredientComponents,
        mockGetUnitConversions,
        ...mockedResponses,
    ]);
};
