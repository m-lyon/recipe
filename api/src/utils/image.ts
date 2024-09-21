import fs from 'fs';
import path from 'path';
import { ReadStream, createReadStream } from 'fs';

import { Sharp } from 'sharp';
import sharp from 'sharp';

interface ImageLoader {
    stream: Sharp | ReadStream;
    contentType: string;
}
export async function loadImage(
    fpath: string,
    quality?: number,
    width?: number,
    height?: number
): Promise<ImageLoader> {
    const stats = fs.statSync(fpath);
    if (!stats.isFile()) {
        throw new Error('File not found');
    }
    const contentType = getContentType(fpath);

    if (['image/svg+xml', 'application/octet-stream'].includes(contentType)) {
        const stream = createReadStream(fpath);
        return { stream, contentType };
    }

    const image = sharp(fpath);
    const metadata = await image.metadata();
    const aspectRatio = metadata.width / metadata.height;
    try {
        quality = Math.trunc(quality ? quality : 100);
        if (width && !height) {
            height = Math.round(width * (1 / aspectRatio));
        } else if (height && !width) {
            width = Math.round(height * aspectRatio);
        } else {
            width = metadata.width;
            height = metadata.height;
        }

        const stream = image
            .resize(width, height)
            .jpeg({ quality, progressive: true, force: false })
            .webp({ quality, force: false })
            .png({ quality, progressive: true, force: false });

        return { stream, contentType };
    } catch (error) {
        console.log(error);
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
