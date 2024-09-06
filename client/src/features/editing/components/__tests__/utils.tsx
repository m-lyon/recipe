import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { useIngredientList } from '@recipe/features/recipeIngredient';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetIngredientsWithRecipe } from '@recipe/graphql/queries/__mocks__/ingredient';

import { EditableIngredientList } from '../EditableIngredientList';

const MockEditableIngredientList = () => {
    const props = useIngredientList();
    return <EditableIngredientList {...props} />;
};

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<MockEditableIngredientList />} />)
);

export const renderComponent = (
    mockedResponses: MockedResponse<Record<string, any>, Record<string, any>>[] = []
) => {
    render(
        <MockedProvider
            mocks={[
                mockGetUnits,
                mockGetIngredientsWithRecipe,
                mockGetPrepMethods,
                mockGetUnitConversions,
                ...mockedResponses,
            ]}
        >
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
};
