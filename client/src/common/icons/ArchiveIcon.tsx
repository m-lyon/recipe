import { Icon, IconProps } from '@chakra-ui/react';

export function ArchiveIcon(props: IconProps) {
    return (
        <Icon viewBox='0 0 24 24' {...props}>
            <path
                fill='currentColor'
                d='M20 3H4c-1.1 0-2 .9-2 2v2c0 .75.41 1.38 1 1.72V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8.72c.59-.34 1-.97 1-1.72V5c0-1.1-.9-2-2-2zm-5 12H9v-2h6v2zm5-8H4V5h16v2z'
            />
        </Icon>
    );
}
