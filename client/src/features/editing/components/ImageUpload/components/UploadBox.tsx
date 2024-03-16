import { Box } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

interface Props {
    handleAddFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
export function UploadBox(props: Props) {
    const { handleAddFile } = props;
    return (
        <Box
            border='3px dashed'
            borderColor='gray.300'
            flex='1'
            display='flex'
            flexDirection='column'
            rounded='lg'
            justifyContent='center'
            alignItems='center'
        >
            <label htmlFor='file-input'>
                <AddIcon
                    boxSize={8}
                    color='gray.300'
                    cursor='pointer'
                    _hover={{ color: 'gray.400' }}
                />
            </label>
            <input
                id='file-input'
                type='file'
                style={{ display: 'none' }}
                onChange={handleAddFile}
            />
        </Box>
    );
}
