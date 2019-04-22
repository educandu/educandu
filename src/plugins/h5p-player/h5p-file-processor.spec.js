const path = require('path');
const testHelper = require('../../test-helper');
const H5pFileProcessor = require('./h5p-file-processor');

jest.setTimeout(15000);

describe('h5p-file-processor', () => {
  let cdn;
  let sut;

  beforeAll(async () => {
    cdn = await testHelper.createTestCdn();
    sut = new H5pFileProcessor(cdn);
  });

  afterAll(async () => {
    await testHelper.removeBucket(cdn);
    await cdn.dispose();
  });

  describe('install', () => {
    const h5pFileName = path.join(__dirname, '../../../test/h5p-test-files/interactive-video-2-618.h5p');
    const applicationId = 'some-application';
    const contentId = 'some-content';
    let result;
    let uploadedFiles;

    beforeAll(async () => {
      result = await sut.install(h5pFileName, contentId, applicationId);
      uploadedFiles = (await cdn.listObjects({ prefix: '', recursive: true })).map(o => o.name);
    });

    it('should return the correct result', () => {
      expect(result).toEqual({ applicationId: 'some-application', contentId: 'some-content' });
    });

    it('should write the elmu info file', () => {
      expect(uploadedFiles).toContain('plugins/h5p-player/apps/some-application/_elmu-info.json');
    });

    it('should move libraries into the libraries folder', () => {
      expect(uploadedFiles).toContain('plugins/h5p-player/apps/some-application/libraries/Drop-1.0/README.md');
    });

    it('should move content into the content/content-id folder', () => {
      expect(uploadedFiles).toContain('plugins/h5p-player/apps/some-application/content/some-content/content.json');
    });

  });

});
