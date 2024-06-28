import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Box, Container, HStack, useToast } from '@chakra-ui/react';

import { ImageUploadPreview, UploadBox } from '@recipe/features/images';

export interface ImageUploadProps {
    images: File[];
    setImages: Dispatch<SetStateAction<File[]>>;
}
export function ImageUpload(props: ImageUploadProps) {
    const { images, setImages } = props;
    const toast = useToast();
    const handleAddFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        if (!/\.(jpeg|jpg|png)$/i.test(file.name) || file.type.split('/')[0] !== 'image') {
            toast({
                title: 'Invalid file type',
                description: 'Please upload an image file',
                status: 'error',
                duration: 2000,
            });
            return;
        }
        setImages((prevImages) => [...prevImages, file]);
    };

    const imagePreviews = images.map((image, index) => {
        return (
            <ImageUploadPreview
                key={index}
                image={image}
                handleRemoveImage={() => setImages((prev) => prev.filter((_, i) => i !== index))}
            />
        );
    });
    return (
        <Container
            maxW='auto'
            flex='1'
            display='flex'
            flexDirection='column'
            paddingLeft='0px'
            paddingRight='0px'
        >
            <Box textAlign='center' fontSize='lg' paddingBottom='6px'>
                Upload your images
            </Box>
            <HStack h='100%' align='stretch'>
                {imagePreviews}
                <UploadBox handleAddFile={handleAddFile} />
            </HStack>
        </Container>
    );
}
