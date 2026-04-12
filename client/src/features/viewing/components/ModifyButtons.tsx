import { Link } from 'react-router-dom';
import { GoArchive } from 'react-icons/go';
import { EditIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { RiInboxUnarchiveLine } from 'react-icons/ri';
import { ActionIcon, Tooltip as MantineTooltip } from '@mantine/core';
import { Box, Flex, IconButton, Spacer, Tooltip } from '@chakra-ui/react';

import { PATH } from '@recipe/constants';
import { UNARCHIVE_RECIPE } from '@recipe/graphql/mutations/recipe';

interface Props {
    recipe: RecipePreview;
    isHovering: boolean;
    hasEditPermission: boolean;
    handleArchive: (id: string) => void;
}
export function ModifyButtons(props: Props) {
    const { recipe, isHovering, hasEditPermission, handleArchive } = props;
    const [unarchiveRecipe] = useMutation(UNARCHIVE_RECIPE, {
        variables: { id: recipe._id },
        update(cache) {
            cache.evict({ id: `Recipe:${recipe._id}` });
            cache.modify({
                fields: { recipeCount: (c) => c - 1 },
            });
        },
    });

    if (!hasEditPermission) return null;

    if (recipe.archived) {
        return (
            <Flex minWidth='max-content' direction='row'>
                <Spacer />
                <Box zIndex={1}>
                    <Box position='absolute'>
                        <Tooltip label={`Unarchive ${recipe.title}`} openDelay={500}>
                            <IconButton
                                variant='solid'
                                colorScheme='gray'
                                aria-label={`Unarchive ${recipe.title}`}
                                icon={<RiInboxUnarchiveLine size='18px' />}
                                isRound={true}
                                shadow='base'
                                opacity={{ base: 1, md: isHovering ? 1 : 0 }}
                                transform={{
                                    base: 'translate(-50%, -50%)',
                                    md: `translate(-50%, -50%) scale(${isHovering ? 1 : 0})`,
                                }}
                                transition='opacity 0.3s, transform 0.3s'
                                onClick={() => unarchiveRecipe()}
                            />
                        </Tooltip>
                    </Box>
                </Box>
            </Flex>
        );
    }

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
            {recipe.veganVersion && (
                <Box zIndex={1}>
                    <Box position='absolute'>
                        <MantineTooltip
                            label={`View vegan version of ${recipe.title}`}
                            openDelay={500}
                        >
                            <ActionIcon
                                variant='filled'
                                color='teal'
                                radius='xl'
                                aria-label={`View vegan version of ${recipe.title}`}
                                component={Link}
                                to={`${PATH.ROOT}/view/recipe/${recipe.veganVersion.titleIdentifier}`}
                                style={{
                                    opacity: isHovering ? 1 : 0,
                                    transform: `translate(-50%, -50%) scale(${isHovering ? 1 : 0})`,
                                    transition: 'opacity 0.3s, transform 0.3s',
                                }}
                            >
                                <svg viewBox='0 0 24 24' width='16' height='16'>
                                    <path
                                        d='M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L7 19c4-1 7-3 9-7 0 3-1 5-3 7l1 2c2-4 4-8 4-14'
                                        fill='currentColor'
                                    />
                                </svg>
                            </ActionIcon>
                        </MantineTooltip>
                    </Box>
                </Box>
            )}
            <Spacer />
            <Box zIndex={1}>
                <Box position='absolute'>
                    <Tooltip label={`Archive ${recipe.title}`} openDelay={500}>
                        <IconButton
                            variant='solid'
                            colorScheme='gray'
                            aria-label={`Archive ${recipe.title}`}
                            icon={<GoArchive size='18px' />}
                            isRound={true}
                            shadow='base'
                            opacity={{ base: 1, md: isHovering ? 1 : 0 }}
                            transform={{
                                base: 'translate(-50%, -50%)',
                                md: `translate(-50%, -50%) scale(${isHovering ? 1 : 0})`,
                            }}
                            transition='opacity 0.3s, transform 0.3s'
                            onClick={() => handleArchive(recipe._id)}
                        />
                    </Tooltip>
                </Box>
            </Box>
        </Flex>
    );
}
