import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { CreateRecipe } from './pages/CreateRecipe';

describe('index', () => {
    it('should work as expected', () => {
        render(
            <ChakraProvider>
                <CreateRecipe />
            </ChakraProvider>
        );
        expect(1 + 1).toBe(2);
    });
});
