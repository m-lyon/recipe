import { forwardRef } from 'react';
import { IconButton } from '@chakra-ui/react';
import { HiOutlineInformationCircle } from 'react-icons/hi';

import { ToggleTip, ToggleTipProps } from './ToggleTip';

export const InfoTip = forwardRef<HTMLDivElement, Partial<ToggleTipProps>>(
    function InfoTip(props, ref) {
        const { children, ...rest } = props;
        return (
            <ToggleTip content={children} {...rest} ref={ref}>
                <IconButton variant='ghost' aria-label='info' size='2xs' colorPalette='gray'>
                    <HiOutlineInformationCircle />
                </IconButton>
            </ToggleTip>
        );
    }
);
