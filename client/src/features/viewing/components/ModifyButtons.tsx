import { Link } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';
import { FaRegEdit } from 'react-icons/fa';
import { Box, Flex, IconButton, Spacer } from '@chakra-ui/react';

import { PATH } from '@recipe/constants';
import { Tooltip } from '@recipe/common/components';

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
                        <Tooltip content={`Edit ${recipe.title}`} showArrow openDelay={500}>
                            <IconButton
                                asChild
                                variant='solid'
                                colorPalette='gray'
                                aria-label={`Edit ${recipe.title}`}
                                borderRadius='full'
                                shadow='base'
                                opacity={{ base: 1, md: isHovering ? 1 : 0 }}
                                transform={{
                                    base: 'translate(-50%, -50%)',
                                    md: `translate(-50%, -50%) scale(${isHovering ? 1 : 0})`,
                                }}
                                transition='opacity 0.3s, transform 0.3s'
                            >
                                <Link to={`${PATH.ROOT}/edit/recipe/${recipe.titleIdentifier}`}>
                                    <FaRegEdit />
                                </Link>
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <Spacer />
                <Box zIndex={1}>
                    <Box position='absolute'>
                        <Tooltip content={`Delete ${recipe.title}`} showArrow openDelay={500}>
                            <IconButton
                                variant='solid'
                                colorPalette='gray'
                                aria-label={`Delete ${recipe.title}`}
                                borderRadius='full'
                                shadow='base'
                                opacity={{ base: 1, md: isHovering ? 1 : 0 }}
                                transform={{
                                    base: 'translate(-50%, -50%)',
                                    md: `translate(-50%, -50%) scale(${isHovering ? 1 : 0})`,
                                }}
                                transition='opacity 0.3s, transform 0.3s'
                                onClick={() => handleDelete(recipe._id)}
                            >
                                <IoClose />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Flex>
        );
    }
}
