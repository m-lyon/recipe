import path from 'path';

import { Router } from 'express';

import { Image } from '../models/Image.js';
import { IMAGE_DIR } from '../constants.js';
import { loadImage } from '../utils/image.js';

export const uploadRouter = Router();

const LOWRES_WIDTH = 720;
uploadRouter.get('/images/:fname', async (req, res) => {
    const fname = req.params.fname;
    if (!fname) {
        return res.status(400).send('Invalid URL.');
    }
    const image = await Image.findOne({ origUrl: path.join('uploads/images', fname) });
    if (!image) {
        return res.status(404).send('Image not found.');
    }
    try {
        const fpath = path.join(IMAGE_DIR, fname);
        const width = +(req.query.width ?? 0);
        const quality = +(req.query.quality ?? 0);
        const height = +(req.query.height ?? 0);
        const save = width === LOWRES_WIDTH && !height && !quality;
        const { stream, contentType } = await loadImage(fpath, quality, width, height, save);
        res.setHeader('Content-Type', contentType);
        stream.pipe(res);
    } catch (error) {
        res.status(500).send('Failed to load image.');
    }
});
