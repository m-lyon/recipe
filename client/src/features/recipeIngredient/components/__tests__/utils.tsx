import { Route, createRoutesFromElements } from 'react-router-dom';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { useIngredientList } from '@recipe/features/recipeIngredient';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { EditableIngredient } from '../EditableIngredient';

export const renderComponent = (mockedResponses: MockedResponses = []) => {
    const MockEditableIngredient = () => {
        const recipeState = useIngredientList();
        const props = {
            subsection: 0,
            item: recipeState.state[0].editable,
            actionHandler: recipeState.actionHandler,
            queryData: recipeState.queryData,
            ingredientNum: 1,
        };
        return <EditableIngredient {...props} />;
    };
    const routes = createRoutesFromElements(
        <Route path='/' element={<MockEditableIngredient />} />
    );
    return renderPage(routes, [
        mockGetIngredientComponents,
        mockGetUnitConversions,
        ...mockedResponses,
    ]);
};
