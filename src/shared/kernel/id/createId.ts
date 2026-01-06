import { randomUUID } from 'node:crypto';
import type { Brand } from './Brand';

export const createId = <B extends string>(brand?: B): Brand<string, B> => {
  return randomUUID() as Brand<string, B>;
};

export const fromString = <B extends string>(value: string, _brand?: B): Brand<string, B> => {
  return value as Brand<string, B>;
};

export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};
