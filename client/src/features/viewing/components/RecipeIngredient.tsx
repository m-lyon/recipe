import { ChevronRightIcon } from '@chakra-ui/icons';
import { Box, Flex, ListItem, Spacer, useDisclosure } from '@chakra-ui/react';

import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';
import { IngredientListRecipe, LikeFinishedRecipeIngredient } from '@recipe/types';
import { RecipeIngredient as RecipeIngredientType } from '@recipe/graphql/generated';

import { RecipeModal } from './RecipeModal';

interface Props {
    ingredient: RecipeIngredientType;
}
export function RecipeIngredient({ ingredient }: Props) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <ListItem key={ingredient._id}>
            <Flex direction='row'>
                <Box
                    position='relative'
                    _before={{
                        content: "''",
                        position: 'absolute',
                        width: '100%',
                        height: '2px',
                        backgroundColor: 'gray.500',
                        bottom: '0',
                        transformOrigin: 'right',
                        transform: 'scaleX(0)',
                        transition: 'transform .3s ease-in-out',
                    }}
                    _hover={{
                        _before: {
                            transformOrigin: 'left',
                            transform: 'scaleX(1)',
                        },
                        cursor: 'pointer',
                    }}
                    onClick={onOpen}
                >
                    {getFinishedRecipeIngredientStr(ingredient as LikeFinishedRecipeIngredient)}
                    <ChevronRightIcon style={{ marginLeft: 5 }} />
                </Box>
                <Spacer />
            </Flex>
            <RecipeModal
                recipe={ingredient.ingredient as IngredientListRecipe}
                isOpen={isOpen}
                onClose={onClose}
            />
        </ListItem>
    );
}
