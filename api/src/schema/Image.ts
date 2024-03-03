import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

import { GraphQLNonNull, GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql';
import { ImageTC } from '../models/Image.js';
import { FileUpload, storeUpload, validateImageFile } from '../utils/upload.js';
import { saveImageToDb } from '../models/Image.js';

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
        validateImageFile(args.file);
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
                validateImageFile(file);
                const origFilepath = storeUpload(file);
                return await saveImageToDb(origFilepath, args._id, args.note);
            })
        );
        return images.map((image) => ({ recordId: image._id }));
    },
});

export const ImageQuery = {
    ImageById: ImageTC.mongooseResolvers.findById(),
    ImageByIds: ImageTC.mongooseResolvers.findByIds(),
    ImageOne: ImageTC.mongooseResolvers.findOne(),
    ImageMany: ImageTC.mongooseResolvers.findMany(),
};

export const ImageMutation = {
    imageUploadOne: ImageTC.getResolver('imageUploadOne'),
    imageUploadMany: ImageTC.getResolver('imageUploadMany'),
};
