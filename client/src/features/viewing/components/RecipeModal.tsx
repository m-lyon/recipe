import { Box, Grid, GridItem } from '@chakra-ui/react';
import { Badge, Divider, ModalCloseButton, useBreakpointValue } from '@chakra-ui/react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';

import { IngredientList, InstructionList } from '@recipe/features/viewing';

interface Props {
    recipe: IngredientAsRecipeView;
    isOpen: boolean;
    onClose: () => void;
}
export function RecipeModal(props: Props) {
    const { recipe, isOpen, onClose } = props;

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
                        <GridItem colSpan={{ base: 20, md: 8 }}>
                            <IngredientList
                                subsections={recipe.ingredientSubsections}
                                currentServings={recipe.numServings}
                                origServings={recipe.numServings}
                            />
                        </GridItem>
                        <GridItem
                            colSpan={{ base: 20, md: 1 }}
                            py={{ base: '12px', md: undefined }}
                        >
                            <Divider
                                orientation={useBreakpointValue({
                                    base: 'horizontal',
                                    md: 'vertical',
                                })}
                            />
                        </GridItem>
                        <GridItem colSpan={{ base: 20, md: 11 }}>
                            <InstructionList
                                instructions={recipe.instructionSubsections}
                                fontSize='md'
                            />
                        </GridItem>
                    </Grid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
