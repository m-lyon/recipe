import { gql } from '../../__generated__';

export const IMAGE_FIELDS = gql(`
    fragment ImageFields on Image {
        _id
        origUrl
        recipe {
            title
        }
    }
`);

export const UPLOAD_IMAGES = gql(`
    mutation UploadImages($images: [Upload!]!, $recipeId: MongoID!) {
        imageUploadMany(files: $images, _id: $recipeId) {
            records {
                ...ImageFields
            }
        }
    }
`);
export const DELETE_IMAGES = gql(`
    mutation DeleteImages($ids: [MongoID!]!) {
        imageRemoveMany(ids: $ids) {
            records {
                ...ImageFields
            }
        }
    }
`);
