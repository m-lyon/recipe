import { Link } from 'react-router-dom';
import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Spacer, Tooltip } from '@chakra-ui/react';

import { PATH } from '@recipe/constants';

interface Props {
    recipe: RecipePreview;
    isHovering: boolean;
    hasEditPermission: boolean;
    handleDelete: (id: string) => void;
}
export function ModifyButtons(props: Props) {
    const { recipe, isHovering, hasEditPermission, handleDelete } = props;
    if (hasEditPermission) {
        return (
            <Flex minWidth='max-content' direction='row'>
                <Box zIndex={1}>
                    <Box position='absolute'>
                        <Tooltip label={`Edit ${recipe.title}`} openDelay={500}>
                            <IconButton
                                variant='solid'
                                colorScheme='gray'
                                aria-label={`Edit ${recipe.title}`}
                                icon={<EditIcon />}
                                isRound={true}
                                shadow='base'
                                opacity={{ base: 1, md: isHovering ? 1 : 0 }}
                                transform={{
                                    base: 'translate(-50%, -50%)',
                                    md: `translate(-50%, -50%) scale(${isHovering ? 1 : 0})`,
                                }}
                                transition='opacity 0.3s, transform 0.3s'
                                as={Link}
                                to={`${PATH.ROOT}/edit/recipe/${recipe.titleIdentifier}`}
                            />
                        </Tooltip>
                    </Box>
                </Box>
                <Spacer />
                <Box zIndex={1}>
                    <Box position='absolute'>
                        <Tooltip label={`Delete ${recipe.title}`} openDelay={500}>
                            <IconButton
                                variant='solid'
                                colorScheme='gray'
                                aria-label={`Delete ${recipe.title}`}
                                icon={<CloseIcon />}
                                isRound={true}
                                shadow='base'
                                opacity={{ base: 1, md: isHovering ? 1 : 0 }}
                                transform={{
                                    base: 'translate(-50%, -50%)',
                                    md: `translate(-50%, -50%) scale(${isHovering ? 1 : 0})`,
                                }}
                                transition='opacity 0.3s, transform 0.3s'
                                onClick={() => handleDelete(recipe._id)}
                            />
                        </Tooltip>
                    </Box>
                </Box>
            </Flex>
        );
    }
}
