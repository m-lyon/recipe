import { Button } from '@chakra-ui/react';

export function ClearSelectionButton(props: {
    disabled?: boolean;
    onClear: () => void;
    label?: string;
}) {
    return (
        <Button
            size='sm'
            variant='outline'
            alignSelf='flex-start'
            onClick={props.onClear}
            isDisabled={props.disabled}
            aria-label='Clear nutritional data selection'
        >
            {props.label ?? 'Clear selection'}
        </Button>
    );
}
