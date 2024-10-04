import fs from 'fs';
import path from 'path';

import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';

import { IMAGE_DIR } from '../constants.js';
import { RecipeTC } from '../models/Recipe.js';
import { Image, ImageTC, saveImageToDb } from '../models/Image.js';
import { FileUpload, storeUpload, validateImageFile } from '../utils/upload.js';

ImageTC.addResolver({
    name: 'imageUploadOne',
    description: 'Upload a single image',
    type: new GraphQLObjectType({
        name: 'ImageUploadPayload',
        fields: {
            record: { type: ImageTC.getType(), description: 'The added image.' },
            recordId: { type: GraphQLString, description: 'The ID of the added image.' },
        },
    }),
    args: {
        file: { description: 'File to store.', type: new GraphQLNonNull(GraphQLUpload) },
        _id: { type: 'MongoID!', description: 'Recipe ID.' },
        note: { type: 'String', description: 'Note about the image.' },
    },
    resolve: async ({ args }) => {
        await validateImageFile(args.file);
        const origFilepath = storeUpload(args.file);
        const image = await saveImageToDb(origFilepath, args._id, args.note);
        return { record: image, recordId: image._id };
    },
});

ImageTC.addResolver({
    name: 'imageUploadMany',
    description: 'Upload multiple images',
    type: new GraphQLObjectType({
        name: 'ImageUploadManyPayload',
        fields: {
            records: {
                type: new GraphQLList(new GraphQLNonNull(ImageTC.getType())),
                description: 'The uploaded images.',
            },
        },
    }),
    args: {
        files: {
            description: 'Files to store.',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLUpload))),
        },
        _id: { type: 'MongoID!', description: 'Recipe ID.' },
        note: { type: 'String', description: 'Note about the image.' },
    },
    resolve: async ({ args }) => {
        const images = await Promise.all(
            args.files.map(async (file: Promise<FileUpload>) => {
                await validateImageFile(file);
                const origFilepath = storeUpload(file);
                const image = await saveImageToDb(origFilepath, args._id, args.note);
                return image;
            })
        );
        return { records: images };
    },
});

ImageTC.addResolver({
    name: 'imageRemoveManyByIds',
    description: 'Remove multiple images by their IDs',
    type: new GraphQLObjectType({
        name: 'ImageRemoveManyPayload',
        fields: {
            records: {
                type: new GraphQLList(new GraphQLNonNull(ImageTC.getType())),
                description: 'The deleted images.',
            },
        },
    }),
    args: {
        ids: { type: '[MongoID!]!', description: 'Image IDs.' },
    },
    resolve: async (rp) => {
        const { args, context } = rp;
        const images: Image[] = context.images;
        // Remove the images from the database
        await Image.deleteMany({ _id: { $in: args.ids } });
        // Remove files from disk
        images.forEach((image) => {
            const filepath = path.join(IMAGE_DIR, path.basename(image.origUrl));
            fs.unlink(filepath, (err) => {
                if (err) throw err;
            });
        });
        return { records: images };
    },
});
ImageTC.addRelation('recipe', {
    resolver: () => RecipeTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source) => source.recipe },
    projection: { recipe: true },
});
ImageTC.extendField('recipe', {
    type: new GraphQLNonNull(RecipeTC.getType()),
});

export const ImageQuery = {
    imageById: ImageTC.mongooseResolvers.findById(),
    imageByIds: ImageTC.mongooseResolvers.findByIds(),
    imageOne: ImageTC.mongooseResolvers.findOne(),
    imageMany: ImageTC.mongooseResolvers.findMany(),
};

export const ImageMutation = {
    imageUploadOne: ImageTC.getResolver('imageUploadOne'),
    imageUploadMany: ImageTC.getResolver('imageUploadMany'),
    imageRemoveMany: ImageTC.getResolver('imageRemoveManyByIds'),
};
