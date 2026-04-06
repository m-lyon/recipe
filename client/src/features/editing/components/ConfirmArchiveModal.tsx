import { useMutation } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import { Button, Group, Modal, Text } from '@mantine/core';

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
        onError(error) {
            notifications.show({
                color: 'red',
                title: 'Archive failed',
                message: error.message,
            });
        },
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
        <Modal opened={show} onClose={() => setShow(false)} title='Archive Recipe'>
            <Text mb='md'>
                Are you sure you want to archive this recipe? You can restore it later.
            </Text>
            <Group justify='flex-end'>
                <Button
                    color='gray'
                    onClick={() => setShow(false)}
                    aria-label='Cancel archive action'
                >
                    Cancel
                </Button>
                <Button
                    color='red'
                    onClick={async () => {
                        try {
                            await archiveRecipe();
                            setShow(false);
                        } catch {
                            // onError handler shows the notification
                        }
                    }}
                    aria-label='Confirm archive action'
                >
                    Confirm
                </Button>
            </Group>
        </Modal>
    );
}
