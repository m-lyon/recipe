import * as CSS from 'csstype';
import { useMeasure } from 'react-use';
import { UseMeasureRef } from 'react-use/lib/useMeasure';
import { AspectRatio, Card, CardBody, CardProps, Image, ResponsiveValue } from '@chakra-ui/react';

import { Images } from '@recipe/types';
import { GRAPHQL_ENDPOINT } from '@recipe/constants';

import { Carousel } from './Carousel';

interface ImageCarouselProps extends CardProps {
    images: Images;
    width: ResponsiveValue<CSS.Property.Width>;
    ratio: number;
    cardRef?: UseMeasureRef<Element>;
    bottomLeftRadius?: ResponsiveValue<CSS.Property.BorderBottomRightRadius>;
    bottomRightRadius?: ResponsiveValue<CSS.Property.BorderBottomRightRadius>;
}
export function ImageCarousel(props: ImageCarouselProps) {
    const { images, width, ratio, cardRef, bottomLeftRadius, bottomRightRadius, ...rest } = props;
    const [ref, { height }] = useMeasure<HTMLImageElement>();

    const imagesCards = images!.map((image, index) => {
        return (
            <CardBody padding='0' key={index}>
                <AspectRatio maxW={width} ratio={ratio} key={index}>
                    <Image
                        src={`${GRAPHQL_ENDPOINT}${image!.origUrl}`}
                        objectFit='contain'
                        onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.preventDefault()}
                        borderBottomLeftRadius={images?.length === 1 ? bottomLeftRadius : 0}
                        borderBottomRightRadius={images?.length === 1 ? bottomRightRadius : 0}
                        ref={index === 0 ? ref : undefined}
                        alt={`Image ${index + 1} for ${image?.recipe?.title}`}
                    />
                </AspectRatio>
            </CardBody>
        );
    });

    return (
        <Card
            height={images!.length > 1 ? height + 36 : height}
            width={width}
            ref={cardRef}
            {...rest}
        >
            {images!.length > 1 ? <Carousel gap={0}>{imagesCards}</Carousel> : imagesCards[0]}
        </Card>
    );
}
