export function getAverageRating(ratings: RatingView[]): number {
    if (ratings.length === 0) {
        return 0;
    }
    return ratings.reduce((sum, record) => sum + record.value, 0) / ratings.length;
}
