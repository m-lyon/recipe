import mongoose from 'mongoose';

const url = process.env.MONGODB_URI;

mongoose.set({ strictQuery: true });
mongoose
    .connect(url)
    .then((db) => {
        console.log('connected to db');
    })
    .catch((err) => {
        console.log(err);
    });

export default mongoose;
