import { Model } from 'mongoose';

interface Attributes {
    [key: string]: Model<any>;
}
export async function validateMongooseObjectIds(attribs: Attributes, next: any) {
    try {
        for (const attrib in attribs) {
            const doc = await attribs[attrib].findById(this[attrib]);
            if (!doc) {
                throw new Error(`${attrib} not found: ${this[attrib]}.`);
            }
        }
        next();
    } catch (err) {
        next(err);
    }
}

export async function validateMongooseObjectIdsArray(attribs: Attributes, next: any) {
    try {
        for (const attrib in attribs) {
            // Do initial query to see if all ids are valid
            const docs = await attribs[attrib].find({ _id: { $in: this[attrib] } });
            if (docs.length !== this[attrib].length) {
                // Then do individual queries to see which ids are invalid
                for (const id of this[attrib]) {
                    const doc = await attribs[attrib].findById(id);
                    if (!doc) {
                        throw new Error(`${attrib} not found: ${id}.`);
                    }
                }
            }
        }
        next();
    } catch (err) {
        next(err);
    }
}
