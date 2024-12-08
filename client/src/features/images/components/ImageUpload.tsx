import { ChangeEvent } from 'react';
import { useShallow } from 'zustand/shallow';
import { Box, Container, Stack } from '@chakra-ui/react';

import { useErrorToast } from '@recipe/common/hooks';
import { ImageUploadPreview, UploadBox, useImagesStore } from '@recipe/features/images';

export function ImageUpload() {
    const { images, addImage, removeImage } = useImagesStore(
        useShallow((state) => ({
            images: state.images,
            addImage: state.addImage,
            removeImage: state.removeImage,
        }))
    );
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
        addImage(file);
    };

    const imagePreviews = images.map((image, index) => {
        return (
            <ImageUploadPreview
                key={index}
                image={image}
                handleRemoveImage={() => removeImage(index)}
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
