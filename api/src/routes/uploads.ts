import path from 'path';

import { Router } from 'express';

import { Image } from '../models/Image.js';
import { IMAGE_DIR } from '../constants.js';

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
    return res.sendFile(fname, { root: IMAGE_DIR }, (err) => {
        if (err) {
            console.error(err);
        }
    });
});
