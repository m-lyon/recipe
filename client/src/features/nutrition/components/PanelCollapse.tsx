import { Box } from '@chakra-ui/react';
import { Collapse } from '@mantine/core';

export const TRANSITION_MS = 300;

export function PanelCollapse(props: { open: boolean; children: React.ReactNode }) {
    return (
        <Collapse in={props.open} transitionDuration={TRANSITION_MS}>
            <Box pt={3}>{props.children}</Box>
        </Collapse>
    );
}
