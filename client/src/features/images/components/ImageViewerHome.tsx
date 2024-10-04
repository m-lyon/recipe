import { ImageCarousel } from '@recipe/common/components';

interface Props {
    images: ImagePreview[];
}
export function ImageViewerHome(props: Props) {
    const { images } = props;

    if (images.length === 0) {
        return null;
    }

    return (
        <ImageCarousel
            images={images.slice(0, 1)}
            width={288}
            ratio={3 / 2}
            right={0}
            top={0}
            shadow='none'
            bottomLeftRadius='md'
            bottomRightRadius='md'
        />
    );
}
