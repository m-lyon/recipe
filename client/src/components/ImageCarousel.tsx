import { AspectRatio, Image, Card, CardProps, CardBody } from '@chakra-ui/react';
import { Carousel } from './Carousel';
import { Image as ImageType } from '../__generated__/graphql';
import { GRAPHQL_ENDPOINT } from '../constants';

export const sliderBarHeight = 36;

interface ImageCarouselProps extends CardProps {
    images: ImageType[];
    width: number;
    height: number;
}
export function ImageCarousel(props: ImageCarouselProps) {
    const { images, width, height, ...rest } = props;
    const ratio = width / height;

    const imagesCards = images.map((image, index) => {
        return (
            <CardBody padding='0' key={index}>
                <AspectRatio maxW={width} ratio={ratio} key={index}>
                    <Image
                        src={`${GRAPHQL_ENDPOINT}${image!.origUrl}`}
                        objectFit='contain'
                        onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.preventDefault()}
                        rounded={images.length === 1 ? 'md' : undefined}
                    />
                </AspectRatio>
            </CardBody>
        );
    });

    return (
        <Card
            height={images.length > 1 ? height + sliderBarHeight : height}
            width={width}
            {...rest}
        >
            {images.length > 1 ? <Carousel gap={0}>{imagesCards}</Carousel> : imagesCards[0]}
        </Card>
    );
}
