import { customAlphabet } from 'nanoid';

const DEFAULT_ID_LENGTH = 22;
const alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

const defaultGenerator = customAlphabet(alphabet, DEFAULT_ID_LENGTH);

function create(length = DEFAULT_ID_LENGTH) {
  return length === DEFAULT_ID_LENGTH
    ? defaultGenerator()
    : customAlphabet(alphabet, length)();
}

export default {
  create
};
