import { useMutation } from '@apollo/client';
import { Button, ModalFooter } from '@chakra-ui/react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';

import { DELETE_RECIPE } from '@recipe/graphql/mutations/recipe';

interface Props {
    show: boolean;
    setShow: (show: boolean) => void;
    recipeId: string;
}
export function ConfirmDeleteModal(props: Props) {
    const { show, setShow, recipeId } = props;
    const [deleteRecipe] = useMutation(DELETE_RECIPE, {
        variables: { id: recipeId },
        update(cache) {
            cache.evict({ id: `Recipe:${recipeId}` });
            cache.modify({
                fields: {
                    recipeCount: (existingCount) => existingCount - 1,
                },
            });
        },
    });
    return (
        <Modal isOpen={show} onClose={() => setShow(false)}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Delete Recipe</ModalHeader>
                <ModalBody>Are you sure you want to delete this recipe?</ModalBody>
                <ModalFooter>
                    <Button
                        variant='outline'
                        mr={3}
                        onClick={() => setShow(false)}
                        aria-label='Cancel delete action'
                    >
                        Cancel
                    </Button>
                    <Button
                        colorPalette='red'
                        onClick={() => {
                            deleteRecipe();
                            setShow(false);
                        }}
                        aria-label='Confirm delete action'
                    >
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
