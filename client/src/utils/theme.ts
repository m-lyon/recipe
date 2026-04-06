import { Button, Modal, createTheme } from '@mantine/core';

export const theme = createTheme({
    components: {
        Modal: Modal.extend({
            styles: {
                title: {
                    fontSize: 'var(--mantine-font-size-xl)',
                    fontWeight: 600,
                },
            },
        }),
        Button: Button.extend({
            defaultProps: {
                size: 'md',
            },
        }),
    },
});
