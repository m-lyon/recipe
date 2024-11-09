import { Box, Container, Stack } from '@chakra-ui/react';
import { ChangeEvent, Dispatch, SetStateAction } from 'react';

import { useErrorToast } from '@recipe/common/hooks';
import { ImageUploadPreview, UploadBox } from '@recipe/features/images';

export interface ImageUploadProps {
    images: File[];
    setImages: Dispatch<SetStateAction<File[]>>;
}
export function ImageUpload(props: ImageUploadProps) {
    const { images, setImages } = props;
    const toast = useErrorToast();
    const handleAddFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        if (!/\.(jpeg|jpg|png)$/i.test(file.name) || file.type.split('/')[0] !== 'image') {
            toast({ title: 'Invalid file type', description: 'Please upload an image file' });
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
            <Box textAlign='center' fontSize='lg'>
                Upload your images
            </Box>
            <Stack
                h='100%'
                align='stretch'
                direction={{ base: 'column', md: 'row' }}
                overflowX={{ base: undefined, md: 'auto' }}
            >
                {imagePreviews}
                <UploadBox handleAddFile={handleAddFile} numImages={imagePreviews.length} />
            </Stack>
        </Container>
    );
}
