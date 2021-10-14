import fs from 'fs';
import path from 'path';
import util from 'util';
import sinon from 'sinon';
import testHelper from '../test-helper';

const writeFile = util.promisify(fs.writeFile);

describe('cdn', () => {
  let sut;
  let testDir;

  beforeEach(async () => {
    sut = await testHelper.createTestCdn();
    testDir = await testHelper.createTestDir();
  });

  afterEach(async () => {
    await testHelper.deleteTestDir(testDir);
    await testHelper.removeBucket(sut);
    await sut.dispose();
  });

  describe('uploadObject', () => {
    const targetFileName = 'some-folder/sub/test-file.txt';
    const testFileContent = 'Hello World!';
    const metadata = { someKey: 'someValue' };
    let testFileName;
    let actualResult;

    beforeEach(async () => {
      testFileName = path.join(testDir, 'test.txt');
      await writeFile(testFileName, testFileContent, 'utf8');
      actualResult = await sut.uploadObject(targetFileName, testFileName, metadata);
    });

    it('should return an object containing the name and etag', () => {
      const expectedResult = { name: sinon.match.string, etag: { etag: sinon.match.string } };
      sinon.assert.match(actualResult, expectedResult);
    });

  });

});
