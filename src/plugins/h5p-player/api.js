const os = require('os');
const path = require('path');
const React = require('react');
const multer = require('multer');
const express = require('express');
const h5pHelper = require('./h5p-helper');
const Cdn = require('../../repositories/cdn');
const ReactDOMServer = require('react-dom/server');
const H5pPlayerIframe = require('./h5p-player-iframe.jsx');
const clientSettings = require('../../bootstrap/client-settings');

const renderPlayTemplate = (integration, h5pLibRootUrl) => {
  const element = React.createElement(H5pPlayerIframe, { integration, h5pLibRootUrl });
  return `<!DOCTYPE html>${ReactDOMServer.renderToStaticMarkup(element)}`;
};

class H5pPlayer {
  static get inject() { return [Cdn]; }

  static get typeName() { return 'h5p-player'; }

  constructor(cdn) {
    this.cdn = cdn;
  }

  register(pathPrefix, router) {
    this.pathPrefix = pathPrefix;

    const multipartParser = multer({ dest: os.tmpdir() });

    router.use('/static', express.static(path.join(__dirname, './static')));

    router.post('/upload', multipartParser.single('file'), async (req, res) => {
      await this.handlePostUpload(req, res);
    });

    router.get('/play/:applicationId', async (req, res) => {
      await this.handleGetPlay(req, res);
    });
  }

  async handlePostUpload(req, res) {
    if (!req.file) {
      return res.sendStatus(400);
    }

    const result = await h5pHelper.install(req.file.path, this.cdn);
    return res.send(result);
  }

  async handleGetPlay(req, res) {
    const proto = req.secure ? 'https' : 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;

    const { applicationId } = req.params;
    const baseUrl = `${proto}://${host}`;
    const h5pLibRootUrl = `${baseUrl}${this.pathPrefix}/static`;
    const applicationRootUrl = `${clientSettings.cdnRootURL}/plugins/h5p-player/content`;

    const integration = await h5pHelper.createIntegration(applicationId, baseUrl, h5pLibRootUrl, applicationRootUrl, this.cdn);
    const html = renderPlayTemplate(integration, h5pLibRootUrl);
    return res.type('html').send(html);
  }
}

module.exports = H5pPlayer;
