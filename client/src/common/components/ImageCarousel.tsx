import * as CSS from 'csstype';
import { useState } from 'react';
import { UseMeasureRef } from 'react-use/lib/useMeasure';
import { Box, ImageProps, Skeleton } from '@chakra-ui/react';
import { AspectRatio, Card, CardRootProps, Image } from '@chakra-ui/react';

import { GRAPHQL_URL } from '@recipe/constants';

import { Carousel } from './Carousel';

interface ImageCarouselProps extends CardRootProps {
    images: Image[];
    width: CSS.Property.Width | number;
    ratio: number;
    cardRef?: UseMeasureRef<HTMLDivElement>;
    bottomLeftRadius?: ImageProps['borderBottomLeftRadius'];
    bottomRightRadius?: ImageProps['borderBottomRightRadius'];
}
export function ImageCarousel(props: ImageCarouselProps) {
    const { images, width, ratio, cardRef, bottomLeftRadius, bottomRightRadius, ...rest } = props;
    const [loading, setLoading] = useState(true);
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
            <Card.Body padding='0' key={index}>
                <AspectRatio maxW={width} ratio={ratio} key={index}>
                    {loading && (
                        <Box>
                            <Skeleton
                                height='90%'
                                width='95%'
                                aria-label={`Loading image ${index + 1} for ${image.recipe.title}`}
                            />
                        </Box>
                    )}
                    <Image
                        src={`${GRAPHQL_URL}${image.origUrl}${queryStr}`}
                        objectFit='contain'
                        loading='lazy'
                        onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.preventDefault()}
                        borderBottomLeftRadius={borderLeft}
                        borderBottomRightRadius={borderRight}
                        alt={`Image ${index + 1} for ${image.recipe.title}`}
                        onLoad={() => setLoading(false)}
                    />
                </AspectRatio>
            </Card.Body>
        );
    });

    return (
        <Card.Root width={width} ref={cardRef} {...rest}>
            {images.length > 1 ? <Carousel gap={0}>{imagesCards}</Carousel> : imagesCards[0]}
        </Card.Root>
    );
}
