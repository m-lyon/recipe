import { Badge, Divider, ModalCloseButton, useBreakpointValue } from '@chakra-ui/react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import { Box, Grid, GridItem, Skeleton, SkeletonCircle, SkeletonText } from '@chakra-ui/react';

import { IngredientList, InstructionList } from '@recipe/features/viewing';

interface Props {
    recipe: RecipeView;
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
                    <Box>
                        {recipe ? recipe.title : <Skeleton height='30px' mb='8px' width='80%' />}
                    </Box>
                    {recipe ? (
                        <Badge
                            variant='subtle'
                            borderRadius='md'
                        >{`${recipe.numServings} Serving${recipe.numServings === 1 ? '' : 's'}`}</Badge>
                    ) : (
                        <Skeleton height='15px' width='80px' />
                    )}
                    <Divider orientation='horizontal' pt='12px' />
                </ModalHeader>
                <ModalCloseButton aria-label={`Close ${recipe ? `${recipe.title} ` : ''}modal`} />
                <ModalBody>
                    <Grid templateColumns='repeat(20, 1fr)' pb='12px'>
                        <GridItem colSpan={{ base: 20, md: 8 }}>
                            {recipe ? (
                                <IngredientList
                                    subsections={recipe.ingredientSubsections}
                                    currentServings={recipe.numServings}
                                    origServings={recipe.numServings}
                                    mr='16px'
                                />
                            ) : (
                                <Box mr='26px'>
                                    <SkeletonCircle size='10' />
                                    <SkeletonText mt='4' noOfLines={6} spacing='4' />
                                </Box>
                            )}
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
                            {recipe ? (
                                <InstructionList
                                    instructions={recipe.instructionSubsections}
                                    fontSize='md'
                                />
                            ) : (
                                <Box>
                                    <SkeletonCircle size='10' />
                                    <SkeletonText mt='4' noOfLines={6} spacing='4' />
                                </Box>
                            )}
                        </GridItem>
                    </Grid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
