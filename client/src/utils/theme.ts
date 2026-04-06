import { Button, MantineTheme, Modal, createTheme } from '@mantine/core';

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
            vars: (_theme: MantineTheme, props) => {
                if (props.variant === 'cancel') {
                    return {
                        root: {
                            '--button-bg': '#ffffff',
                            '--button-bd': '1px solid #E2E8F0',
                            '--button-hover': '#E2E8F0',
                            '--button-color': '#1A202C',
                            '--button-radius': '0.375rem',
                        },
                    };
                }
                if (props.variant === 'danger') {
                    return {
                        root: {
                            '--button-bg': '#E53E3E',
                            '--button-hover': '#C53030',
                            '--button-color': '#FFFFFF',
                            '--button-radius': '0.375rem',
                        },
                    };
                }
                return { root: {} };
            },
            styles: (_theme, props) => {
                if (props.variant === 'cancel' || props.variant === 'danger') {
                    return {
                        root: { transition: 'background-color 150ms ease' },
                    };
                }
                return {};
            },
        }),
    },
});
