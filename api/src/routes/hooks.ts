import { Router } from 'express';

export const hooksRouter = Router();

hooksRouter.post('/:uploadId', async (req, res) => {
    const uploadId = req.params.uploadId;
    if (!uploadId) {
        return res.status(400).send('Invalid URL.');
    }
    console.log('received hook for upload', uploadId);
    return res.status(200).send('OK');
});
