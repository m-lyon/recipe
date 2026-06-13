import { Button, Checkbox, MantineTheme, Modal, Notification, createTheme } from '@mantine/core';

import checkboxClasses from './checkbox.module.css';

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
        Notification: Notification.extend({
            styles: {
                title: {
                    fontWeight: 700,
                },
                description: {
                    fontWeight: 400,
                },
            },
        }),
        Checkbox: Checkbox.extend({
            classNames: (_theme, props) => {
                if (props.variant === 'chakra-style') {
                    return {
                        root: checkboxClasses.root,
                        inner: checkboxClasses.inner,
                        input: checkboxClasses.input,
                        label: checkboxClasses.label,
                    };
                }
                return {};
            },
            vars: (_theme, props) => {
                if (props.variant === 'chakra-style') {
                    return {
                        root: {
                            '--checkbox-color': '#319795',
                            '--checkbox-icon-color': '#ffffff',
                            '--checkbox-size': '16px',
                        },
                    };
                }
                return { root: {} };
            },
        }),
        Button: Button.extend({
            defaultProps: {
                size: 'md',
            },
            vars: (_theme: MantineTheme, props) => {
                if (props.variant === 'outline') {
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
                if (props.variant === 'outline' || props.variant === 'danger') {
                    return {
                        root: { transition: 'background-color 400ms ease' },
                    };
                }
                return {};
            },
        }),
    },
});
