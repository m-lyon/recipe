import { Image, Recipe } from '../../../__generated__/graphql';
import { ImageCarousel } from '../../../components/ImageCarousel';

interface Props {
    images: Recipe['images'];
}
export function ImageViewerHome(props: Props) {
    const { images } = props;

    if (!images || images.length === 0) {
        return null;
    }

    return (
        <ImageCarousel
            images={images as Image[]}
            width='288px'
            ratio={3 / 2}
            zIndex={1}
            right={0}
            top={0}
            shadow='none'
        />
    );
}
