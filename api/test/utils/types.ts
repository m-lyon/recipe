import type { Document, Types } from 'mongoose';

/**
 * An id as the tests pass it: a document's ObjectId, or the string `_id` parsed from a response.
 */
export type DocId = Types.ObjectId | string;

/**
 * A model field as it can be sent in a GraphQL record: references as ObjectIds or strings,
 * dates as Dates or strings, and nested subdocuments mapped the same way.
 */
type InputValue<T> = T extends Types.ObjectId
    ? DocId
    : T extends Date
      ? Date | string
      : T extends (infer U)[]
        ? InputValue<U>[]
        : T extends object
          ? RecordInput<T>
          : T;

/**
 * A GraphQL record for a model: any of the model's own fields, without the `Document` members.
 * Every field is optional, since tests also send incomplete records to exercise validation, and
 * nullable, as GraphQL input fields are.
 */
export type RecordInput<TModel> = {
    [K in Exclude<keyof TModel, keyof Document>]?: InputValue<TModel[K]> | null;
};
