import { Rating } from 'react-simple-star-rating';
import { FaRegStar, FaStar } from 'react-icons/fa6';

export interface StarRatingProps {
    rating: number;
    setRating: (rating: number) => void;
    readonly?: boolean;
}
export function StarRating(props: StarRatingProps) {
    const { rating, setRating, readonly } = props;

    return (
        <div role='rating'>
            <Rating
                readonly={readonly}
                initialValue={rating}
                onClick={setRating}
                allowFraction
                SVGstorkeWidth={1.5}
                fillColor='rgba(0, 0, 0, 0.64)'
                SVGstrokeColor='rgba(0, 0, 0, 0.64)'
                fillIcon={<FaStar size={20} style={{ display: 'inline-block' }} />}
                emptyIcon={
                    <FaRegStar
                        size={20}
                        style={{ display: 'inline-block' }}
                        aria-label='Select star rating'
                    />
                }
            />
        </div>
    );
}
