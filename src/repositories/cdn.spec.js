import fs from 'fs';
import path from 'path';
import util from 'util';
import sinon from 'sinon';
import Cdn from './cdn.js';
import { createTestDir, deleteTestDir, setupTestEnvironment, destroyTestEnvironment, pruneTestEnvironment } from '../test-helper.js';

const writeFile = util.promisify(fs.writeFile);

describe('cdn', () => {
  let container;
  let sut;
  let testDir;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(Cdn);
    testDir = await createTestDir();
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
    await deleteTestDir(testDir);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('uploadObject', () => {
    const targetFileName = 'some-directory/sub/test-file.txt';
    const testFileContent = 'Hello World!';
    let testFileName;
    let actualResult;

    beforeEach(async () => {
      testFileName = path.join(testDir, 'test.txt');
      await writeFile(testFileName, testFileContent, 'utf8');
      actualResult = await sut.uploadObject(targetFileName, testFileName);
    });

    it('should return an object containing the name and etag', () => {
      const expectedResult = { name: sinon.match.string, etag: { etag: sinon.match.string } };
      sinon.assert.match(actualResult, expectedResult);
    });

  });

});
