import { Button, Group, Modal, Text } from '@mantine/core';

interface Props {
    show: boolean;
    setShow: (show: boolean) => void;
    title: string;
    body: string;
    confirmLabel?: string;
    confirmDisabled?: boolean;
    cancelAriaLabel: string;
    confirmAriaLabel: string;
    onConfirm: () => void;
}

export function ConfirmModal(props: Props) {
    const {
        show,
        setShow,
        title,
        body,
        confirmLabel = 'Confirm',
        confirmDisabled = false,
        cancelAriaLabel,
        confirmAriaLabel,
        onConfirm,
    } = props;

    return (
        <Modal opened={show} onClose={() => setShow(false)} title={title}>
            <Text mb='md'>{body}</Text>
            <Group justify='flex-end'>
                <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setShow(false)}
                    aria-label={cancelAriaLabel}
                >
                    Cancel
                </Button>
                <Button
                    size='sm'
                    variant='danger'
                    onClick={() => {
                        setShow(false);
                        onConfirm();
                    }}
                    disabled={confirmDisabled}
                    aria-label={confirmAriaLabel}
                >
                    {confirmLabel}
                </Button>
            </Group>
        </Modal>
    );
}
