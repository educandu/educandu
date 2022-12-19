import { customAlphabet } from 'nanoid';

const alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 22);

function create() {
  return nanoid();
}

export default {
  create
};
