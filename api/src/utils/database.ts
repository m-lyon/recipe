import mongoose from 'mongoose';

import { MONGODB_URI } from '../constants.js';

mongoose.set({ strictQuery: true });
mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log('connected to db');
    })
    .catch((err) => {
        console.log(err);
    });

export default mongoose;
