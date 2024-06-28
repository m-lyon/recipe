import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { Card, CardBody, IconButton, Image } from '@chakra-ui/react';

interface Props {
    image: File;
    handleRemoveImage: () => void;
}
export function ImageUploadPreview(props: Props) {
    const { image, handleRemoveImage } = props;
    const imgSource = URL.createObjectURL(image);

    return (
        <Card shadow='none'>
            <CardBody padding='16px'>
                <IconButton
                    variant='solid'
                    colorScheme='gray'
                    aria-label={`Edit ${image.name}`}
                    icon={<EditIcon />}
                    isRound={true}
                    position='absolute'
                    shadow='base'
                    top='0'
                    left='0'
                    zIndex='1'
                />
                <Image
                    src={imgSource}
                    maxW='200px'
                    alt={image.name}
                    borderRadius='lg'
                    shadow='base'
                />
                <IconButton
                    variant='solid'
                    colorScheme='gray'
                    aria-label={`Remove ${image.name}`}
                    shadow='base'
                    icon={<CloseIcon />}
                    isRound={true}
                    position='absolute'
                    top='0'
                    right='0'
                    zIndex='1'
                    onClick={() => {
                        URL.revokeObjectURL(imgSource);
                        handleRemoveImage();
                    }}
                />
            </CardBody>
        </Card>
    );
}
