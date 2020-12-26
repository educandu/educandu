import { v4 } from 'uuid';
import anyBase from 'any-base';

const flickrBase58 = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const hexToFlickrBase58 = anyBase(anyBase.HEX, flickrBase58);

export function create() {
  return hexToFlickrBase58(v4().replace(/-/g, ''));
}

export default {
  create
};
