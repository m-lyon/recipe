import { FaStar, FaRegStar } from 'react-icons/fa6';
import { Rating } from 'react-simple-star-rating';

export interface StarRatingProps {
    rating: number;
    setRating: (rating: number) => void;
}
export function StarRating(props: StarRatingProps) {
    const { rating, setRating } = props;

    return (
        <Rating
            initialValue={rating}
            onClick={setRating}
            allowFraction
            SVGstorkeWidth={1.5}
            fillColor='rgba(0, 0, 0, 0.64)'
            SVGstrokeColor='rgba(0, 0, 0, 0.64)'
            fillIcon={<FaStar size={20} style={{ display: 'inline-block' }} />}
            emptyIcon={<FaRegStar size={20} style={{ display: 'inline-block' }} />}
        />
    );
}
