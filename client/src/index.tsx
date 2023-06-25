import { createRoot } from 'react-dom/client';
import { CreateRecipePage } from './pages/CreateRecipePage';
import { ChakraProvider } from '@chakra-ui/react';

const domNode = document.getElementById('root');
const root = createRoot(domNode);

root.render(
    <ChakraProvider>
        <CreateRecipePage />
    </ChakraProvider>
);
