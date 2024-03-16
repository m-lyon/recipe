import { gql } from '../../__generated__';

export const UPLOAD_IMAGES = gql(`
    mutation UploadImages($images: [Upload!]!, $recipeId: MongoID!) {
        imageUploadMany(files: $images, _id: $recipeId) {
            recordId
        }
    }
`);
