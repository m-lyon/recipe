import * as CSS from 'csstype';
import { useBreakpointValue } from '@chakra-ui/react';
import { UseMeasureRef } from 'react-use/lib/useMeasure';

import { Image, Recipe } from '@recipe/graphql/generated';
import { ImageCarousel } from '@recipe/common/components';

export const imageCardWidth = 360;
export const sliderBarHeight = 36;

interface Props {
    images: Recipe['images'];
    cardRef?: UseMeasureRef<Element>;
    position?: CSS.Property.Position;
}
export function ImageViewerRecipe(props: Props) {
    const { images, cardRef, position } = props;
    const width = useBreakpointValue(
        { base: '100%', md: `${imageCardWidth}px` },
        { fallback: 'md' }
    );

    if (!images || images.length === 0) {
        return null;
    }

    return (
        <ImageCarousel
            images={images as Image[]}
            width={width!}
            ratio={3 / 2}
            position={position ? position : 'absolute'}
            zIndex={1}
            right={0}
            top={0}
            cardRef={cardRef}
            imgBottomRightRadius={0}
        />
    );
}
