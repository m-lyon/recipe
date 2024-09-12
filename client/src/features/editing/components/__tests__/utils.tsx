import { Route, createRoutesFromElements } from 'react-router-dom';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { useIngredientList } from '@recipe/features/recipeIngredient';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetIngredientsWithRecipe } from '@recipe/graphql/queries/__mocks__/ingredient';

import { EditableIngredientList } from '../EditableIngredientList';

export const renderComponent = (mockedResponses: MockedResponses = []) => {
    const MockEditableIngredientList = () => {
        const props = useIngredientList();
        return <EditableIngredientList {...props} />;
    };
    const routes = createRoutesFromElements(
        <Route path='/' element={<MockEditableIngredientList />} />
    );
    renderPage(routes, [
        mockGetUnits,
        mockGetIngredientsWithRecipe,
        mockGetPrepMethods,
        mockGetUnitConversions,
        ...mockedResponses,
    ]);
};
