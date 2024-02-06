import express from 'express';

export const imagesUploadRouter = express.Router();

imagesUploadRouter.get('/images/:url', (req, res) => {
    res.sendFile(req.params.url);
});
