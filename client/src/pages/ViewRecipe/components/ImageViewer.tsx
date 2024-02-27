import { AspectRatio, Card, CardBody, Image } from '@chakra-ui/react';
import { Carousel } from './Carousel';
import { Image as ImageType, Maybe } from '../../../__generated__/graphql';
import { GRAPHQL_ENDPOINT } from '../../../constants';

export const imageCardWidth = 360;
const imageRatio = 3 / 2;
export const imageCardHeight = imageCardWidth / imageRatio;
export const sliderBarHeight = 36;

interface Props {
    images: Maybe<ImageType>[];
}
export function ImageViewer(props: Props) {
    const { images } = props;

    const imagesCards = images.map((image, index) => (
        <CardBody key={index} padding='0'>
            <AspectRatio maxW={imageCardWidth} ratio={imageRatio}>
                <Image
                    src={`${GRAPHQL_ENDPOINT}${image!.origUrl}`}
                    objectFit='contain'
                    onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.preventDefault()}
                />
            </AspectRatio>
        </CardBody>
    ));

    if (images.length === 1) {
        return <Card variant='image'>{imagesCards[0]}</Card>;
    }
    return (
        <Card
            h={images.length > 1 ? imageCardHeight + sliderBarHeight : imageCardHeight}
            w={imageCardWidth}
            position='absolute'
            zIndex={1}
            right={0}
            top={0}
        >
            <Carousel gap={0}>{imagesCards}</Carousel>
        </Card>
    );
}
