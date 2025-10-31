import { useLazyQuery } from '@apollo/client';

import { Box, Flex, ListItem, Spacer, useDisclosure } from '@chakra-ui/react';

import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

import { RecipeModal } from './RecipeModal';

interface Props {
    ingredient: RecipeIngredientAsRecipeView;
}
export function RecipeIngredient({ ingredient }: Props) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [getRecipe, { data }] = useLazyQuery(GET_RECIPE);

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
                    onClick={() => {
                        onOpen();
                        getRecipe({ variables: { filter: { _id: ingredient.ingredient._id } } });
                    }}
                    aria-label={`View ${ingredient.ingredient.title}`}
                >
                    {getFinishedRecipeIngredientStr(ingredient)}
                    <ChevronRightIcon style={{ marginLeft: 5 }} />
                </Box>
                <Spacer />
            </Flex>
            <RecipeModal recipe={data?.recipeOne} isOpen={isOpen} onClose={onClose} />
        </ListItem>
    );
}
