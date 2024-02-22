import { AspectRatio, Card, CardBody, Image } from '@chakra-ui/react';
import { imageCardWidth, imageRatio } from '../../../theme/chakraTheme';
import { Carousel } from './Carousel';

interface Props {
    images: string[];
}
export function ImageViewer(props: Props) {
    const { images } = props;

    const imagesCards = images.map((src, index) => (
        <CardBody key={index} padding='0'>
            <AspectRatio maxW={imageCardWidth} ratio={imageRatio}>
                <Image
                    src={src}
                    alt='naruto'
                    objectFit='cover'
                    onDragStart={(e: React.DragEvent<HTMLImageElement>) => e.preventDefault()}
                />
            </AspectRatio>
        </CardBody>
    ));

    if (images.length === 1){
        return (
            <Card variant='image'>
                {imagesCards[0]}
            </Card>
        );
    }
    return (
        <Card variant='image'>
            <Carousel gap={32}>
                {imagesCards}
            </Carousel>
        </Card>
    );
}
