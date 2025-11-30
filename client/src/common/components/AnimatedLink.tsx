import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import { Anchor, AnchorProps } from '@mantine/core';

import classes from './AnimatedLink.module.css';

interface Props extends Omit<AnchorProps, 'component'> {
    to: string;
    children: React.ReactNode;
    useChevron?: boolean;
}

export function AnimatedLink(props: Props) {
    const { to, children, useChevron = true, ...rest } = props;
    return (
        <Anchor
            className={classes.link}
            component={Link}
            to={to}
            underline='never'
            {...rest}
            styles={{}}
        >
            {children}
            {useChevron && (
                <FaChevronRight size={10} style={{ display: 'inline', marginLeft: 5 }} />
            )}
        </Anchor>
    );
}
