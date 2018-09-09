const os = require('os');
const path = require('path');
const multer = require('multer');
const express = require('express');
const urls = require('../../utils/urls');
const Cdn = require('../../repositories/cdn');
const H5pFileProcessor = require('./h5p-file-processor');
const H5pPlayerRenderer = require('./h5p-player-renderer');
const requestHelper = require('../../utils/request-helper');

const DEFAULT_CONTENT_ID = '1';

class H5pPlayer {
  static get inject() { return [H5pFileProcessor, H5pPlayerRenderer, Cdn]; }

  static get typeName() { return 'h5p-player'; }

  constructor(h5pFileProcessor, h5pPlayerRenderer, cdn, pathPrefix) {
    this.pathPrefix = pathPrefix;
    this.h5pFileProcessor = h5pFileProcessor;
    this.h5pPlayerRenderer = h5pPlayerRenderer;
    this.cdn = cdn;
  }

  registerRoutes(router) {
    const multipartParser = multer({ dest: os.tmpdir() });

    router.use('/static', express.static(path.join(__dirname, './static')));

    router.post('/upload', multipartParser.single('file'), async (req, res) => {
      await this.handleUpload(req, res);
    });

    router.get('/play/:applicationId', async (req, res) => {
      await this.handlePlay(req, res);
    });
  }

  async handleUpload(req, res) {
    if (!req.file) {
      return res.sendStatus(400);
    }

    const result = await this.h5pFileProcessor.install(req.file.path, DEFAULT_CONTENT_ID);
    return res.send(result);
  }

  async handlePlay(req, res) {
    const { applicationId } = req.params;
    const { origin } = requestHelper.getHostInfo(req);
    const h5pLibRootUrl = urls.concatParts(origin, this.pathPrefix, 'static');

    const html = await this.h5pPlayerRenderer.renderHtml(applicationId, origin, h5pLibRootUrl, DEFAULT_CONTENT_ID);
    return res.type('html').send(html);
  }
}

module.exports = H5pPlayer;
