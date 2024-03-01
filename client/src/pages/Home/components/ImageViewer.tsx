import { Image } from '../../../__generated__/graphql';
import { ImageCarousel } from '../../../components/ImageCarousel';
import { Recipe } from '../../../__generated__/graphql';

export const imageCardWidth = 360;
const imageRatio = 3 / 2;
export const imageCardHeight = imageCardWidth / imageRatio;
export const sliderBarHeight = 36;

interface Props {
    images: Recipe['images'];
}
export function ImageViewer(props: Props) {
    const { images } = props;

    if (!images || images.length === 0) {
        return null;
    }

    return (
        <ImageCarousel
            images={images as Image[]}
            width={288}
            height={160}
            zIndex={1}
            right={0}
            top={0}
            shadow='none'
        />
    );
}
