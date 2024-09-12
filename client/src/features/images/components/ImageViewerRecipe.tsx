import * as CSS from 'csstype';
import { ResponsiveValue } from '@chakra-ui/react';
import { UseMeasureRef } from 'react-use/lib/useMeasure';

import { Image, Recipe } from '@recipe/graphql/generated';
import { ImageCarousel } from '@recipe/common/components';

export const imageCardWidth = 360;
export const sliderBarHeight = 36;

interface Props {
    images: Recipe['images'];
    cardRef?: UseMeasureRef<Element>;
    position?: ResponsiveValue<CSS.Property.Position>;
    display?: ResponsiveValue<CSS.Property.Display>;
}
export function ImageViewerRecipe(props: Props) {
    const { images, cardRef, position, display } = props;

    if (!images || images.length === 0) {
        return null;
    }

    return (
        <ImageCarousel
            images={images as Image[]}
            width={{ base: '100%', md: `${imageCardWidth}px` }}
            ratio={3 / 2}
            position={position ? position : 'absolute'}
            zIndex={1}
            right={0}
            top={0}
            cardRef={cardRef}
            bottomLeftRadius={{ base: '0', md: 'md' }}
            bottomRightRadius={0}
            display={display}
        />
    );
}
