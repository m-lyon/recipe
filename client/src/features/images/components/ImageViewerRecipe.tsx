import * as CSS from 'csstype';
import { UseMeasureRef } from 'react-use/lib/useMeasure';
import { ResponsiveValue, useBreakpointValue } from '@chakra-ui/react';

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
    const variant = useBreakpointValue<CSS.Property.Width | number>({
        base: '100%',
        md: imageCardWidth,
    });

    if (!images || images.length === 0) {
        return null;
    }

    return (
        <ImageCarousel
            images={images as Image[]}
            width={variant ?? imageCardWidth}
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
