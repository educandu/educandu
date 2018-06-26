/* eslint no-warning-comments: 0 */

const del = require('del');
const path = require('path');
const sut = require('./h5p-helper');

describe('h5p-helper', () => {

  describe('install', () => {

    beforeEach(async () => {
      const tempDir = path.join(__dirname, '../../../.tmp');
      const h5pFileName = path.join(__dirname, '../../../test/h5p-test-files/interactive-video-2-618.h5p');

      await del(tempDir);
      await sut.install(h5pFileName, null, tempDir);
    });

    it('works', () => {
      // TODO Check file-system!
      expect(1).toBe(1);
    });

  });

});
