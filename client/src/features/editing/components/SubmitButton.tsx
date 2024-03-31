import { Box, Button, Center } from '@chakra-ui/react';

interface Props {
    submitText: string;
    loadingText?: string;
    disabled?: boolean;
    loading?: boolean;
    handleSubmit: () => void;
}
export function SubmitButton(props: Props) {
    const { submitText, loadingText, disabled, loading, handleSubmit } = props;
    return (
        <Center>
            <Box position='fixed' bottom='4' pb='3'>
                <Button
                    size='lg'
                    borderRadius='full'
                    border='1px'
                    borderColor='gray.200'
                    onClick={handleSubmit}
                    loadingText={loadingText}
                    isDisabled={disabled}
                    isLoading={loading}
                >
                    {submitText}
                </Button>
            </Box>
        </Center>
    );
}
