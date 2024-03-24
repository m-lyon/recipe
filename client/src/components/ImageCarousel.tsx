import * as CSS from 'csstype';
import { useRef } from 'react';
import { useSize } from '@chakra-ui/react-use-size';
import { AspectRatio, Card, CardBody, CardProps, Image } from '@chakra-ui/react';

import { Carousel } from './Carousel';
import { GRAPHQL_ENDPOINT } from '../constants';
import { Image as ImageType } from '../__generated__/graphql';

interface ImageCarouselProps extends CardProps {
    images: ImageType[];
    width: CSS.Property.Width;
    ratio: number;
    cardRef?: (instance: Element | null) => void;
}
export function ImageCarousel(props: ImageCarouselProps) {
    const { images, width, ratio, cardRef, ...rest } = props;
    const ref = useRef<HTMLImageElement>(null);
    const dims = useSize(ref);

    const imagesCards = images.map((image, index) => {
        return (
            <CardBody padding='0' key={index}>
                <AspectRatio maxW={width} ratio={ratio} key={index}>
                    <Image
                        src={`${GRAPHQL_ENDPOINT}${image!.origUrl}`}
                        objectFit='contain'
                        onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.preventDefault()}
                        rounded={images.length === 1 ? 'md' : undefined}
                        ref={index === 0 ? ref : undefined}
                    />
                </AspectRatio>
            </CardBody>
        );
    });

    const height = dims?.height || 0;
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
