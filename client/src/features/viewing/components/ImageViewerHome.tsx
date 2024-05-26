import { Image, Recipe } from '@recipe/graphql/generated';
import { ImageCarousel } from '@recipe/common/components';

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
            images={images.slice(0, 1) as Image[]}
            width='288px'
            ratio={3 / 2}
            right={0}
            top={0}
            shadow='none'
        />
    );
}
