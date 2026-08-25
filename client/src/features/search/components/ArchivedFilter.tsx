import { Checkbox } from '@mantine/core';

interface Props {
    showArchived: boolean;
    setShowArchived: (value: boolean) => void;
}

export function ArchivedFilter(props: Props) {
    const { showArchived, setShowArchived } = props;

    return (
        <Checkbox
            variant='chakra-style'
            styles={{ label: { color: '#718096' } }}
            w='100%'
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            label='Show archived'
            aria-label='Show archived recipes'
        />
    );
}
