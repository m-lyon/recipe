import path from 'path';

import { Router } from 'express';

import { Image } from '../models/Image.js';
import { IMAGE_DIR } from '../constants.js';
import { loadImage } from '../utils/image.js';

export const uploadRouter = Router();

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
        const { stream, contentType } = await loadImage(
            path.join(IMAGE_DIR, fname),
            +(req.query.quality ?? 0),
            +(req.query.width ?? 0),
            +(req.query.height ?? 0)
        );
        res.setHeader('Content-Type', contentType);
        stream.pipe(res);
    } catch (error) {
        res.status(500).send('Failed to load image.');
    }
});
