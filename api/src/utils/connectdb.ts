import { connect, set } from 'mongoose';

const url = process.env.MONGO_DB_CONNECTION_STRING;
set({ strictQuery: true });
connect(url)
    .then((db) => {
        console.log('connected to db');
    })
    .catch((err) => {
        console.log(err);
    });
