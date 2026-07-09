import { FiShare } from 'react-icons/fi';
import { IconButton } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';

interface Props {
    title: string;
}

// Floating action button for sharing the current recipe. Uses the native Web Share
// sheet where available (mobile / installed PWA) and falls back to copying the link
// to the clipboard on platforms without the Web Share API (most desktop browsers).
export function ShareButton(props: Props) {
    const { title } = props;
    const successToast = useSuccessToast();

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch (error) {
                // Ignore user-initiated cancellation of the share sheet.
                if ((error as Error).name !== 'AbortError') {
                    throw error;
                }
            }
            return;
        }
        await navigator.clipboard.writeText(url);
        successToast({ title: 'Link copied', position: 'top' });
    };

    return (
        <IconButton
            aria-label='Share recipe'
            icon={<FiShare />}
            onClick={handleShare}
            isRound
            colorScheme='teal'
            size='lg'
            position='fixed'
            bottom='24px'
            right='24px'
            boxShadow='lg'
            zIndex={15}
        />
    );
}
