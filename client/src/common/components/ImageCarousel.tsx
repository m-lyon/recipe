import * as CSS from 'csstype';
import { useMeasure } from 'react-use';
import { UseMeasureRef } from 'react-use/lib/useMeasure';
import { AspectRatio, Card, CardBody, CardProps, Image } from '@chakra-ui/react';

import { GRAPHQL_ENDPOINT } from '@recipe/constants';
import { Image as ImageType } from '@recipe/graphql/generated';

import { Carousel } from './Carousel';

interface ImageCarouselProps extends CardProps {
    images: ImageType[];
    width: CSS.Property.Width;
    ratio: number;
    cardRef?: UseMeasureRef<Element>;
    imgBottomRightRadius?: CSS.Property.BorderBottomRightRadius;
}
export function ImageCarousel(props: ImageCarouselProps) {
    const { images, width, ratio, cardRef, imgBottomRightRadius, ...rest } = props;
    const [ref, { height }] = useMeasure<HTMLImageElement>();

    const imagesCards = images.map((image, index) => {
        return (
            <CardBody padding='0' key={index}>
                <AspectRatio maxW={width} ratio={ratio} key={index}>
                    <Image
                        src={`${GRAPHQL_ENDPOINT}${image!.origUrl}`}
                        objectFit='contain'
                        onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.preventDefault()}
                        borderBottomRadius={images.length === 1 ? 'md' : 0}
                        borderBottomRightRadius={images.length === 1 ? imgBottomRightRadius : 0}
                        ref={index === 0 ? ref : undefined}
                        alt={`Image ${index + 1} for ${image.recipe?.title}`}
                    />
                </AspectRatio>
            </CardBody>
        );
    });

    return (
        <Card
            height={images.length > 1 ? height + 36 : height}
            width={width}
            ref={cardRef}
            {...rest}
        >
            {images.length > 1 ? <Carousel gap={0}>{imagesCards}</Carousel> : imagesCards[0]}
        </Card>
    );
}
