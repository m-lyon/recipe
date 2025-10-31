import { SkeletonText } from '@chakra-ui/react';
import { Badge, VStack, useBreakpointValue } from '@chakra-ui/react';
import { Box, Grid, GridItem, Separator, Skeleton, SkeletonCircle } from '@chakra-ui/react';

import { Dialog } from '@recipe/components/ui/dialog';
import { IngredientList, InstructionList } from '@recipe/features/viewing';

import { Notes } from './Notes';

interface Props {
    recipe: RecipeView;
    isOpen: boolean;
    onClose: () => void;
}
export function RecipeModal(props: Props) {
    const { recipe, isOpen, onClose } = props;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size='xl'>
            <Dialog.Content>
                <Dialog.Header pb='8px'>
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
                    <Separator orientation='horizontal' pt='12px' />
                </Dialog.Header>
                <Dialog.CloseTrigger
                    aria-label={`Close ${recipe ? `${recipe.title} ` : ''}modal`}
                />
                <Dialog.Body>
                    <Grid templateColumns='repeat(20, 1fr)' pb='12px'>
                        <GridItem colSpan={{ base: 20, md: 8 }}>
                            {recipe ? (
                                <VStack align='left'>
                                    <IngredientList
                                        subsections={recipe.ingredientSubsections}
                                        currentServings={recipe.numServings}
                                        origServings={recipe.numServings}
                                        mr='16px'
                                    />
                                    <Notes notes={recipe.notes} />
                                </VStack>
                            ) : (
                                <Box mr='26px'>
                                    <SkeletonCircle size='10' />
                                    <SkeletonText mt='4' noOfLines={6} gap='4' />
                                </Box>
                            )}
                        </GridItem>
                        <GridItem
                            colSpan={{ base: 20, md: 1 }}
                            py={{ base: '12px', md: undefined }}
                        >
                            <Separator
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
                                    <SkeletonText mt='4' noOfLines={6} gap='4' />
                                </Box>
                            )}
                        </GridItem>
                    </Grid>
                </Dialog.Body>
            </Dialog.Content>
        </Dialog.Root>
    );
}
