import { Route, createRoutesFromElements } from 'react-router-dom';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { useIngredientList } from '@recipe/features/recipeIngredient';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { EditableIngredientList } from '../EditableIngredientList';

export const renderComponent = (mockedResponses: MockedResponses = []) => {
    const MockEditableIngredientList = () => {
        const props = useIngredientList();
        return <EditableIngredientList {...props} />;
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
