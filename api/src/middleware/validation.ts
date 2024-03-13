import { User } from '../models/User.js';

export function uniqueInAdminsAndUser(model: string, attribute: string) {
    async function validator(value: string) {
        let owner = this.owner;
        if (!this.isNew) {
            // For update operation, use the updated owner value
            const doc = await this.constructor.findById(this._id);
            owner = doc.owner;
        }
        const admins = await User.find({ role: 'admin' });
        const count = await this.model(model).countDocuments({
            $or: [{ owner }, { owner: { $in: admins } }],
            [attribute]: value,
        });
        return count === 0;
    }
    return validator;
}

export function unique(model: string, attribute: string) {
    async function validator(value: string) {
        const count = await this.model(model).countDocuments({ [attribute]: value });
        return count === 0;
    }
    return validator;
}
