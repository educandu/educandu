const he = require('he');
const htmlescape = require('htmlescape');
const h5pHelper = require('./h5p-helper');
const Cdn = require('../../repositories/cdn');
const clientSettings = require('../../bootstrap/client-settings');

const renderPlayTemplate = (contentId, integration, h5pLibRootUrl) => `
<!DOCTYPE html>
<html>
<head>
  <title>H5P Player</title>
  <script src="${h5pLibRootUrl}/js/jquery.js"></script>
  <script src="${h5pLibRootUrl}/js/h5p.js"></script>
  <script src="${h5pLibRootUrl}/js/h5p-event-dispatcher.js"></script>
  <script src="${h5pLibRootUrl}/js/h5p-x-api-event.js"></script>
  <script src="${h5pLibRootUrl}/js/h5p-x-api.js"></script>
  <script src="${h5pLibRootUrl}/js/h5p-content-type.js"></script>
  <script src="${h5pLibRootUrl}/js/h5p-confirmation-dialog.js"></script>
  <script src="${h5pLibRootUrl}/js/h5p-action-bar.js"></script>
  <link rel="stylesheet" href="${h5pLibRootUrl}/styles/h5p.css">
  <link rel="stylesheet" href="${h5pLibRootUrl}/styles/h5p-confirmation-dialog.css">
  <link rel="stylesheet" href="${h5pLibRootUrl}/styles/h5p-core-button.css">
  <style>
    body { margin: 0; }
  </style>
</head>
<body>
  <div class="h5p-iframe-wrapper">
    <iframe id="h5p-iframe-${he.encode(contentId)}" class="h5p-iframe" data-content-id="${he.encode(contentId)}" style="height:1px" src="about:blank" frameborder="0" scrolling="no"></iframe>
  </div>
  <script>
    window.H5PIntegration = ${htmlescape(integration)};
  </script>
  <script src="/scripts/iframeResizer.contentWindow.min.js"></script>
</body>
</html>
`;

class H5pPlayer {
  static get inject() { return [Cdn]; }

  static get typeName() { return 'h5p-player'; }

  constructor(cdn) {
    this.cdn = cdn;
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

    const { contentId } = req.params;
    const baseUrl = `${proto}://${host}`;
    const h5pLibRootUrl = `${baseUrl}/plugins/h5p-player/static`;
    const applicationRootUrl = `${clientSettings.cdnRootURL}/plugins/h5p-player/content`;

    const integration = await h5pHelper.createIntegration(contentId, baseUrl, h5pLibRootUrl, applicationRootUrl);
    const html = renderPlayTemplate(contentId, integration, h5pLibRootUrl);
    return res.type('html').send(html);
  }
}

module.exports = H5pPlayer;
