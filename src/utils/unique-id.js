const uuidv4 = require('uuid/v4');
const anyBase = require('any-base');

const flickrBase58 = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const hexToFlickrBase58 = anyBase(anyBase.HEX, flickrBase58);

module.exports = {
  create() {
    return hexToFlickrBase58(uuidv4().replace(/-/g, ''));
  }
};
