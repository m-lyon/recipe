import { Box } from '@chakra-ui/react';


interface Props {
    handleAddFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
    numImages: number;
}
export function UploadBox(props: Props) {
    const { handleAddFile, numImages } = props;
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
            minH={200}
            minW={{ base: undefined, md: 282 }}
            mb='16px'
            mt={{ base: numImages > 0 ? '0px' : '16px', md: '16px' }}
            mx={{ base: '16px', md: '0px' }}
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
                aria-label='Upload image'
            />
        </Box>
    );
}
