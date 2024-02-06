import path from 'path';

import { createWriteStream, unlink } from 'fs';
import { nanoid } from 'nanoid';
import { IMAGE_DIR } from '../constants.js';
import { GraphQLError } from 'graphql';

export interface FileUpload {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => NodeJS.ReadStream;
}
export async function storeUpload(file: Promise<FileUpload>): Promise<string> {
    const { createReadStream, filename } = await file;
    const ext = path.extname(filename);
    const stream = createReadStream();
    const id = nanoid();
    const savePath = path.join(IMAGE_DIR, `${id}${ext}`);

    await new Promise((resolve, reject) => {
        const writeStream = createWriteStream(savePath);
        writeStream.on('finish', resolve);
        writeStream.on('error', (error) => {
            unlink(savePath, () => {
                reject(error);
            });
        });
        stream.on('error', (error) => writeStream.destroy(error));
        stream.pipe(writeStream);
    });

    return savePath;
}

export async function validateImageFile(file: Promise<FileUpload>) {
    const { filename, mimetype } = await file;
    try {
        const ext = path.extname(filename);
        if (!['.jpg', '.jpeg', '.png', '.tiff'].includes(ext)) {
            throw new Error('Invalid file type');
        }
        // if (!['image/jpeg', 'image/png'].includes(mimetype)) {
        //     throw new Error('Invalid file type');
        // }
    } catch (err) {
        throw new GraphQLError(err);
    }
}
