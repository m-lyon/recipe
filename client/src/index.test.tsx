import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { CreateRecipePage } from './pages/CreateRecipePage';

describe('index', () => {
    it('should work as expected', () => {
        render(
            <ChakraProvider>
                <CreateRecipePage />
            </ChakraProvider>
        );
        expect(1 + 1).toBe(2);
    });
});
