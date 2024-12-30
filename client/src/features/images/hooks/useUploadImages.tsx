import { useMutation } from '@apollo/client';

import { IMAGE_FIELDS, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';

export function useUploadImages() {
    const [uploadImagesMutation, { loading }] = useMutation(UPLOAD_IMAGES);
    const uploadImages = (images: File[], recipe: RecipeView) => {
        if (!recipe) {
            throw new Error('Recipe not found');
        }
        return uploadImagesMutation({
            variables: { images, recipeId: recipe._id },
            context: { headers: { 'apollo-require-preflight': true } },
            update(cache, { data }) {
                const { records } = data?.imageUploadMany || {};
                if (!records) {
                    return;
                }
                cache.modify({
                    id: cache.identify(recipe),
                    fields: {
                        images(existing) {
                            const refs = records.map((img) => {
                                return cache.writeFragment({
                                    data: img,
                                    fragment: IMAGE_FIELDS,
                                    fragmentName: 'ImageFields',
                                });
                            });
                            const newRefs = refs.filter((ref) => !existing.includes(ref));
                            return [...existing, ...newRefs];
                        },
                    },
                });
            },
        });
    };

    return { uploadImages, loading };
}
