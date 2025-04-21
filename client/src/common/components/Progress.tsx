import { ReactNode, forwardRef } from 'react';
import { Progress as ChakraProgress } from '@chakra-ui/react';

import { InfoTip } from './InfoTip';

interface ProgressProps extends ChakraProgress.RootProps {
    showValueText?: boolean;
    valueText?: ReactNode;
    label?: ReactNode;
    info?: ReactNode;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(props, ref) {
    const { showValueText, valueText, label, info, ...rest } = props;
    return (
        <ChakraProgress.Root {...rest} ref={ref}>
            {label && (
                <ChakraProgress.Label>
                    {label} {info && <InfoTip>{info}</InfoTip>}
                </ChakraProgress.Label>
            )}
            <ChakraProgress.Track>
                <ChakraProgress.Range />
            </ChakraProgress.Track>
            {showValueText && <ChakraProgress.ValueText>{valueText}</ChakraProgress.ValueText>}
        </ChakraProgress.Root>
    );
});
