import { Checkbox, FormControl, FormLabel, Tooltip, useBreakpointValue } from '@chakra-ui/react';

interface Props {
    showArchived: boolean;
    setShowArchived: (value: boolean) => void;
}

export function ArchivedFilter(props: Props) {
    const { showArchived, setShowArchived } = props;
    const isMobile = useBreakpointValue({ base: true, md: false });

    return (
        <Tooltip
            label={showArchived ? 'Hide archived recipes' : 'Show archived recipes'}
            openDelay={500}
        >
            <FormControl
                display='flex'
                alignItems='center'
                justifyContent='center'
                w={isMobile ? '100%' : 'auto'}
                px={isMobile ? 3 : 0}
            >
                <Checkbox
                    isChecked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    colorScheme='teal'
                    aria-label='Show archived recipes'
                >
                    <FormLabel m={0} ml={2} cursor='pointer'>
                        Show archived recipes
                    </FormLabel>
                </Checkbox>
            </FormControl>
        </Tooltip>
    );
}
