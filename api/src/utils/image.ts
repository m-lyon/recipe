import fs from 'fs';
import path from 'path';
import { ReadStream, createReadStream } from 'fs';

import sharp from 'sharp';
import { Sharp } from 'sharp';
import { nanoid } from 'nanoid';
import { Types } from 'mongoose';

import { IMAGE_DIR } from '../constants.js';
import { Image, Image as ImageType } from '../models/Image.js';

interface ImageLoader {
    stream: Sharp | ReadStream;
    contentType: string;
}
export async function loadImage(
    fpath: string,
    quality?: number,
    width?: number,
    height?: number,
    save?: boolean
): Promise<ImageLoader> {
    const stats = fs.statSync(fpath);
    if (!stats.isFile()) {
        throw new Error('File not found');
    }
    const contentType = getContentType(fpath);

    // Load original image if no width, height, or quality is provided
    if (!width && !height && !quality) {
        const stream = createReadStream(fpath);
        return { stream, contentType };
    }

    // Load SVG or binary files as is
    if (['image/svg+xml', 'application/octet-stream'].includes(contentType)) {
        const stream = createReadStream(fpath);
        return { stream, contentType };
    }

    try {
        const image = sharp(fpath);
        const metadata = await image.metadata();
        const aspectRatio = metadata.width / metadata.height;

        quality = Math.trunc(quality ? quality : 100);
        if (width && !height) {
            height = Math.round(width * (1 / aspectRatio));
        } else if (height && !width) {
            width = Math.round(height * aspectRatio);
        } else {
            width = metadata.width;
            height = metadata.height;
        }

        const ext = path.extname(fpath);
        const cachedPath = fpath.replace(ext, `_${width}w${height}h${quality}q${ext}`);

        // Load cached image if it exists
        if (fs.existsSync(cachedPath)) {
            const stream = createReadStream(cachedPath);
            return { stream, contentType };
        }

        const stream = image
            .resize(width, height)
            .jpeg({ quality, progressive: true, force: false })
            .webp({ quality, force: false })
            .png({ quality, progressive: true, force: false });

        if (save) {
            stream.clone().toFile(cachedPath);
        }

        return { stream, contentType };
    } catch (error) {
        throw new Error('Failed to load image');
    }
}

function getContentType(fileName: string): string {
    const ext = path.extname(fileName).slice(1);
    switch (ext) {
        case 'jpg':
        case 'jfif':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'svg':
            return 'image/svg+xml';
        default:
            return 'application/octet-stream';
    }
}

/**
 * Copies an image file on disk and creates a new Image document for newRecipeId.
 * Returns the saved Image document.
 */
export async function copyImageForRecipe(
    sourceImage: ImageType,
    newRecipeId: Types.ObjectId
): Promise<ImageType> {
    const srcFile = path.join(IMAGE_DIR, path.basename(sourceImage.origUrl));
    const ext = path.extname(srcFile);
    const newFilename = `${nanoid()}${ext}`;
    const destFile = path.join(IMAGE_DIR, newFilename);

    fs.copyFileSync(srcFile, destFile);

    const newImage = new Image({
        origUrl: path.join('uploads/images', newFilename),
        recipe: newRecipeId,
        note: sourceImage.note,
    });
    return newImage.save();
}
