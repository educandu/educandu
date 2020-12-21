const anyBase = require('any-base');
const { v4: uuid } = require('uuid');

const flickrBase58 = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const hexToFlickrBase58 = anyBase(anyBase.HEX, flickrBase58);

module.exports = {
  create() {
    return hexToFlickrBase58(uuid().replace(/-/g, ''));
  }
};
