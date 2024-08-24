import { Box, Grid, GridItem } from '@chakra-ui/react';
import { Badge, Divider, ModalCloseButton, useBreakpointValue } from '@chakra-ui/react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';

import { IngredientListRecipe } from '@recipe/types';
import { IngredientList, InstructionList } from '@recipe/features/viewing';

interface Props {
    recipe: IngredientListRecipe;
    isOpen: boolean;
    onClose: () => void;
}
export function RecipeModal(props: Props) {
    const { recipe, isOpen, onClose } = props;

    const styles = useBreakpointValue(
        {
            base: {
                ingrColSpan: 20,
                dividerColSpan: 20,
                dividerPy: '12px',
                dividerOrientation: 'horizontal' as const,
                instrColSpan: 20,
            },
            md: {
                ingrColSpan: 8,
                dividerColSpan: 1,
                dividerPy: undefined,
                dividerOrientation: 'vertical' as const,
                instrColSpan: 11,
            },
        },
        { fallback: 'md' }
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} size='xl'>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb='8px'>
                    <Box>{recipe.title}</Box>
                    <Badge
                        variant='subtle'
                        borderRadius='md'
                    >{`${recipe.numServings} Serving${recipe.numServings === 1 ? '' : 's'}`}</Badge>
                    <Divider orientation='horizontal' pt='12px' />
                </ModalHeader>
                <ModalCloseButton aria-label={`Close ${recipe.title} modal`} />
                <ModalBody>
                    <Grid templateColumns='repeat(20, 1fr)' pb='12px'>
                        <GridItem colSpan={styles?.ingrColSpan}>
                            <IngredientList
                                subsections={recipe.ingredientSubsections}
                                currentServings={recipe.numServings}
                                origServings={recipe.numServings}
                            />
                        </GridItem>
                        <GridItem colSpan={styles?.dividerColSpan} py={styles?.dividerPy}>
                            <Divider orientation={styles?.dividerOrientation} />
                        </GridItem>
                        <GridItem colSpan={styles?.instrColSpan}>
                            <InstructionList instructions={recipe.instructions} fontSize='md' />
                        </GridItem>
                    </Grid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
