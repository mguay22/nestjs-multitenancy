import * as usersSchema from '../users/schema';

export type Schema = typeof usersSchema;

export const schema = {
  ...usersSchema,
};
