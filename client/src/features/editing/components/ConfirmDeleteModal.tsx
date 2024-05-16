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
        refetchQueries: ['GetRecipes'],
    });
    return (
        <Modal isOpen={show} onClose={() => setShow(false)}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Delete Recipe</ModalHeader>
                <ModalBody>Are you sure you want to delete this recipe?</ModalBody>
                <ModalFooter>
                    <Button variant='outline' mr={3} onClick={() => setShow(false)}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme='red'
                        onClick={() => {
                            deleteRecipe();
                            setShow(false);
                        }}
                    >
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
