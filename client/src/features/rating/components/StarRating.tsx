import { Box, BoxProps } from '@chakra-ui/react';
import { Rating } from 'react-simple-star-rating';
import { FaRegStar, FaStar } from 'react-icons/fa6';

export interface StarRatingProps extends BoxProps {
    rating: number;
    addRating: (rating: number) => void;
    colour: string;
    readonly?: boolean;
    size?: number;
}
export function StarRating(props: StarRatingProps) {
    const { rating, addRating, colour, readonly, size = 20, ...rest } = props;

    return (
        <Box role='rating' {...rest}>
            <Rating
                readonly={readonly}
                initialValue={rating}
                onClick={addRating}
                allowFraction
                SVGstorkeWidth={1.5}
                fillColor={colour}
                SVGstrokeColor={colour}
                fillIcon={<FaStar size={size} style={{ display: 'inline-block' }} />}
                emptyIcon={
                    <FaRegStar
                        size={size}
                        style={{ display: 'inline-block' }}
                        aria-label='Select star rating'
                    />
                }
            />
        </Box>
    );
}
