import { gql } from '../../__generated__';

export const UPLOAD_IMAGES = gql(`
    mutation UploadImages($images: [Upload!]!, $recipeId: MongoID!) {
        imageUploadMany(files: $images, _id: $recipeId) {
            records {
                _id
                origUrl
                recipe {
                    title
                }
            }
        }
    }
`);

export const DELETE_IMAGES = gql(`
    mutation DeleteImages($ids: [MongoID!]!) {
        imageRemoveMany(ids: $ids) {
            records {
                _id
                recipe
            }
        }
    }
`);

export const IMG_FRAGMENT = gql(`
    fragment NewImage on Image {
        _id
        origUrl
        recipe {
            title
        }
    }
`);
