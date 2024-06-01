import fs from 'fs';
import path from 'path';

import { GraphQLNonNull, GraphQLObjectType } from 'graphql';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { GraphQLError, GraphQLList, GraphQLString } from 'graphql';

import { IMAGE_DIR } from '../constants.js';
import { Image, ImageTC, saveImageToDb } from '../models/Image.js';
import { FileUpload, storeUpload, validateImageFile } from '../utils/upload.js';

ImageTC.addResolver({
    name: 'imageUploadOne',
    description: 'Upload a single image',
    type: new GraphQLObjectType({
        name: 'ImageUploadPayload',
        fields: {
            recordId: { type: GraphQLString },
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
        return { recordId: image._id };
    },
});

ImageTC.addResolver({
    name: 'imageUploadMany',
    description: 'Upload multiple images',
    type: '[ImageUploadPayload]',
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
                return await saveImageToDb(origFilepath, args._id, args.note);
            })
        );
        return images.map((image) => ({ recordId: image._id }));
    },
});

// TODO: figure out the correct return type for this
ImageTC.addResolver({
    name: 'imageRemoveManyByIds',
    description: 'Remove multiple images by their IDs',
    type: new GraphQLObjectType({
        name: 'ImageRemovePayload',
        fields: {
            recordIds: { type: new GraphQLList(GraphQLString) },
        },
    }),
    args: {
        ids: { type: '[MongoID!]!', description: 'Image IDs.' },
    },
    resolve: async (rp) => {
        const { args, context } = rp;
        const images = context.images;
        // Remove the images from the database
        await Image.deleteMany(args.filter);
        // Remove files from disk
        images.forEach((image: Image) => {
            const filepath = path.join(IMAGE_DIR, path.basename(image.origUrl));
            fs.unlink(filepath, (err) => {
                if (err) throw err;
            });
        });
    },
});

ImageTC.addResolver({
    name: 'generateImages',
    type: 'String',
    args: {
        _id: { type: 'MongoID!', description: 'Recipe ID to generate images for' },
        num: { type: 'Int', description: 'Number of images to generate' },
    },
    resolve: async ({ args }) => {
        // recipe authorisation check is handled by middleware
        if (!args.num) {
            args.num = 3;
        }
        if (args.num < 1 || args.num > 10) {
            throw new GraphQLError('Invalid number of images.', {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        return 'Images queued for generation.';
    },
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
    generateImages: ImageTC.getResolver('generateImages'),
};
