import * as CSS from 'csstype';
import { UseMeasureRef } from 'react-use/lib/useMeasure';
import { Box, ResponsiveValue, Skeleton } from '@chakra-ui/react';
import { AspectRatio, Card, CardBody, CardProps, Image } from '@chakra-ui/react';

import { GRAPHQL_URL } from '@recipe/constants';

import { Carousel } from './Carousel';

interface ImageCarouselProps extends CardProps {
    images: Image[];
    width: CSS.Property.Width | number;
    ratio: number;
    cardRef?: UseMeasureRef<Element>;
    bottomLeftRadius?: ResponsiveValue<CSS.Property.BorderBottomRightRadius>;
    bottomRightRadius?: ResponsiveValue<CSS.Property.BorderBottomRightRadius>;
}
export function ImageCarousel(props: ImageCarouselProps) {
    const { images, width, ratio, cardRef, bottomLeftRadius, bottomRightRadius, ...rest } = props;

    const imagesCards = images.map((image, index) => {
        let queryStr = '';
        if (typeof width === 'number') {
            if (2 * width <= 720) {
                queryStr = `?width=720`;
            } else {
                queryStr = `?width=${2 * width}`;
            }
        } else if (width === '100%') {
            queryStr = '?width=1080';
        }
        const borderLeft = images.length === 1 ? bottomLeftRadius : 0;
        const borderRight = images.length === 1 ? bottomRightRadius : 0;

        return (
            <CardBody padding='0' key={index}>
                <AspectRatio maxW={width} ratio={ratio} key={index}>
                    <Image
                        src={`${GRAPHQL_URL}${image.origUrl}${queryStr}`}
                        objectFit='contain'
                        onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.preventDefault()}
                        borderBottomLeftRadius={borderLeft}
                        borderBottomRightRadius={borderRight}
                        alt={`Image ${index + 1} for ${image.recipe.title}`}
                        fallback={
                            <Box>
                                <Skeleton
                                    height='90%'
                                    width='95%'
                                    aria-label={`Loading image ${index + 1} for ${image.recipe.title}`}
                                />
                            </Box>
                        }
                    />
                </AspectRatio>
            </CardBody>
        );
    });

    return (
        <Card width={width} ref={cardRef} {...rest}>
            {images.length > 1 ? <Carousel gap={0}>{imagesCards}</Carousel> : imagesCards[0]}
        </Card>
    );
}
