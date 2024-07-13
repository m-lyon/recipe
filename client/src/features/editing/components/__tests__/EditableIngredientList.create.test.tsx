import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, getDefaultNormalizer, render, screen } from '@testing-library/react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { useIngredientList } from '@recipe/features/recipeIngredient';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCreateUnit } from '@recipe/graphql/mutations/__mocks__/unit';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockCreatePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockCreateIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetIngredientsWithRecipe } from '@recipe/graphql/queries/__mocks__/ingredient';

import { EditableIngredientList } from '../EditableIngredientList';

loadErrorMessages();
loadDevMessages();

const MockEditableIngredientList = () => {
    const props = useIngredientList();
    return <EditableIngredientList {...props} />;
};

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<MockEditableIngredientList />} />)
);

const renderComponent = () => {
    render(
        <MockedProvider
            mocks={[
                mockGetUnits,
                mockGetIngredientsWithRecipe,
                mockGetPrepMethods,
                mockCreateUnit,
                mockCreateIngredient,
                mockCreatePrepMethod,
                mockGetUnitConversions,
            ]}
        >
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('Creating new items', () => {
    afterEach(() => {
        cleanup();
    });
    it('should create a new unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        await user.keyboard('{c}{u}{t}');
        await user.click(screen.getByText('Long singular name'));
        await user.keyboard('{c}{u}{t}{t}{i}{n}{g}');
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));

        // Expect --------------------------------------------------------------
        expect(
            screen.queryByText('1 cut ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('add new ingredient')).not.toBeNull();
        // ------ Available as new unit ----------------------------------------
        await user.keyboard('{Escape}');
        await user.click(screen.getByLabelText('Enter ingredient'));
        await user.keyboard('{2}{ }');
        expect(await screen.findByLabelText('teaspoons')).not.toBeNull();
        expect(screen.queryByLabelText('cutting')).not.toBeNull();
    });
    it('should create a new ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('add new ingredient'));
        await user.keyboard('beef');
        await user.click(screen.getByLabelText('Save ingredient'));

        // Expect --------------------------------------------------------------
        expect(
            screen.queryByText('1 beef, ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('skip prep method')).not.toBeNull();
        // ------ Available as new ingredient -----------------------------------
        await user.keyboard('{Escape}');
        await user.click(screen.getByLabelText('Enter ingredient'));
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('skip unit'));
        expect(await screen.findByLabelText('apples')).not.toBeNull();
        expect(screen.queryByLabelText('beef')).not.toBeNull();
    });
    it('should create a new prep method', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('chicken'));
        await user.keyboard('{p}');
        await user.click(screen.getByText('add new prep method'));
        await user.keyboard('pipped');
        await user.click(screen.getByLabelText('Save prep method'));

        // Expect --------------------------------------------------------------
        expect(screen.queryByText('1 chicken, pipped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
        // ------ Available as new prepMethod -----------------------------------
        expect(await screen.findByLabelText('skip quantity')).not.toBeNull();
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('chickens'));
        expect(await screen.findByLabelText('skip prep method')).not.toBeNull();
        expect(screen.queryByLabelText('pipped')).not.toBeNull();
    });
});
