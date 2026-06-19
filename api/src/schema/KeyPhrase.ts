import { Recipe } from '../models/Recipe.js';
import { KeyPhrase, KeyPhraseTC } from '../models/KeyPhrase.js';
import { createOneResolver, updateByIdResolver } from './utils.js';

KeyPhraseTC.addResolver({
    name: 'updateById',
    description: 'Update a key phrase by its ID',
    type: KeyPhraseTC.mongooseResolvers.updateById().getType(),
    args: KeyPhraseTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(KeyPhrase, KeyPhraseTC),
});

KeyPhraseTC.addResolver({
    name: 'createOne',
    description: 'Create a new key phrase',
    type: KeyPhraseTC.mongooseResolvers.createOne().getType(),
    args: KeyPhraseTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(KeyPhrase, KeyPhraseTC),
});

export const KeyPhraseQuery = {
    keyPhraseById: KeyPhraseTC.mongooseResolvers
        .findById()
        .setDescription('Retrieve a key phrase by its ID'),
    keyPhraseByIds: KeyPhraseTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple key phrases by their IDs'),
    keyPhraseOne: KeyPhraseTC.mongooseResolvers
        .findOne()
        .setDescription('Retrieve a single key phrase'),
    keyPhraseMany: KeyPhraseTC.mongooseResolvers
        .findMany()
        .setDescription('Retrieve multiple key phrases'),
};

export const KeyPhraseMutation = {
    keyPhraseCreateOne: KeyPhraseTC.getResolver('createOne'),
    keyPhraseUpdateById: KeyPhraseTC.getResolver('updateById'),
    keyPhraseRemoveById: KeyPhraseTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a key phrase by its ID'),
};

// Returns true if the phrase value appears in any recipe instruction text
export const KeyPhraseQueryExtra = {
    keyPhraseUsedInRecipes: {
        type: 'Boolean!',
        args: { value: 'String!' },
        resolve: async (_: unknown, { value }: { value: string }) => {
            const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedValue}\\b`, 'i');
            const found = await Recipe.findOne({
                'instructionSubsections.instructions': { $regex: regex },
            }).lean();
            return found !== null;
        },
    },
};
