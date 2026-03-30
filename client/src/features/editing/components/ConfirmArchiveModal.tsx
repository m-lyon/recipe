import { useMutation } from '@apollo/client';
import { Button, ModalFooter } from '@chakra-ui/react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';

import { ARCHIVE_RECIPE } from '@recipe/graphql/mutations/recipe';

interface Props {
    show: boolean;
    setShow: (show: boolean) => void;
    recipeId: string;
}
export function ConfirmArchiveModal(props: Props) {
    const { show, setShow, recipeId } = props;
    const [archiveRecipe] = useMutation(ARCHIVE_RECIPE, {
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
                <ModalHeader>Archive Recipe</ModalHeader>
                <ModalBody>
                    Are you sure you want to archive this recipe? You can restore it later.
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant='outline'
                        mr={3}
                        onClick={() => setShow(false)}
                        aria-label='Cancel archive action'
                    >
                        Cancel
                    </Button>
                    <Button
                        colorScheme='orange'
                        onClick={() => {
                            archiveRecipe();
                            setShow(false);
                        }}
                        aria-label='Confirm archive action'
                    >
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
