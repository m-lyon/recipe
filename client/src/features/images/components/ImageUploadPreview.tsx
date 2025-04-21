import { IoClose } from 'react-icons/io5';
import { FaRegEdit } from 'react-icons/fa';
import { Box, Card, IconButton, Image } from '@chakra-ui/react';

interface Props {
    image: File;
    handleRemoveImage: () => void;
}
export function ImageUploadPreview(props: Props) {
    const { image, handleRemoveImage } = props;
    const imgSource = URL.createObjectURL(image);

    return (
        <Box
            display='flex'
            justifyContent='center'
            flexDirection={{ base: 'row', md: 'column' }}
            minW={{ base: undefined, md: 282 }}
        >
            <Card.Root shadow='none'>
                <Card.Body padding='16px'>
                    <IconButton
                        variant='solid'
                        colorPalette='gray'
                        aria-label={`Edit ${image.name}`}
                        borderRadius='full'
                        position='absolute'
                        shadow='base'
                        top='0'
                        left='0'
                        zIndex='1'
                    >
                        <FaRegEdit />
                    </IconButton>
                    <Image
                        src={imgSource}
                        w={{ base: undefined, md: '250px' }}
                        alt={image.name}
                        borderRadius='lg'
                        shadow='base'
                    />
                    <IconButton
                        variant='solid'
                        colorPalette='gray'
                        aria-label={`Remove ${image.name}`}
                        shadow='base'
                        borderRadius='full'
                        position='absolute'
                        top='0'
                        right='0'
                        zIndex='1'
                        onClick={() => {
                            URL.revokeObjectURL(imgSource);
                            handleRemoveImage();
                        }}
                    >
                        <IoClose />
                    </IconButton>
                </Card.Body>
            </Card.Root>
        </Box>
    );
}
