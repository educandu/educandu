const React = require('react');
const h5pHelper = require('./h5p-helper');
const Cdn = require('../../repositories/cdn');
const ReactDOMServer = require('react-dom/server');
const H5pPlayerIframe = require('./h5p-player-iframe');

class H5pPlayerRenderer {
  static get inject() { return [Cdn]; }

  constructor(cdn) {
    this.cdn = cdn;
  }

  async renderHtml(applicationId, baseUrl, h5pLibRootUrl, contentId) {
    const applicationRootUrl = `${this.cdn.rootUrl}/${h5pHelper.CDN_APPLICATION_PREFIX}/${applicationId}`;

    const h5pLibScripts = [
      `${h5pLibRootUrl}/js/jquery.js`,
      `${h5pLibRootUrl}/js/h5p.js`,
      `${h5pLibRootUrl}/js/h5p-event-dispatcher.js`,
      `${h5pLibRootUrl}/js/h5p-x-api-event.js`,
      `${h5pLibRootUrl}/js/h5p-x-api.js`,
      `${h5pLibRootUrl}/js/h5p-content-type.js`,
      `${h5pLibRootUrl}/js/h5p-confirmation-dialog.js`,
      `${h5pLibRootUrl}/js/h5p-action-bar.js`,
      `${h5pLibRootUrl}/js/request-queue.js`
    ];

    const h5pLibStyles = [
      `${h5pLibRootUrl}/styles/h5p.css`,
      `${h5pLibRootUrl}/styles/h5p-confirmation-dialog.css`,
      `${h5pLibRootUrl}/styles/h5p-core-button.css`
    ];

    const elmuInfo = await this.loadElmuInfo(applicationId);
    const integration = this.createIntegration(elmuInfo, baseUrl, applicationRootUrl, contentId, h5pLibScripts, h5pLibStyles);
    return this.renderPlayTemplate(integration, h5pLibScripts, h5pLibStyles);
  }

  createIntegration(elmuInfo, baseUrl, applicationRootUrl, contentId, h5pLibScripts, h5pLibStyles) {
    const { dependencies, content, manifest } = elmuInfo;

    return {
      baseUrl: baseUrl, // No trailing slash
      url: applicationRootUrl, // Relative to web root
      siteUrl: `${baseUrl}/`, // Only if NOT logged in!
      postUserStatistics: false,
      l10n: {},
      loadedJs: [],
      loadedCss: [],
      core: {
        scripts: h5pLibScripts,
        styles: h5pLibStyles
      },
      contents: {
        [`cid-${contentId}`]: {
          library: this.getMainLibraryForContent(manifest),
          jsonContent: JSON.stringify(content),
          fullScreen: false, // No fullscreen support
          mainId: contentId,
          url: applicationRootUrl,
          title: manifest.title,
          contentUserData: null,
          displayOptions: {
            frame: false, // Show frame and buttons below H5P
            export: false, // Display download button
            embed: false, // Display embed button
            copyright: true, // Display copyright button
            icon: false // Display H5P icon
          },
          styles: dependencies.preloadedCss.map(p => `${applicationRootUrl}/${p}`),
          scripts: dependencies.preloadedJs.map(p => `${applicationRootUrl}/${p}`)
        }
      }
    };
  }

  async loadElmuInfo(applicationId) {
    const elmuInfoFile = `${h5pHelper.CDN_APPLICATION_PREFIX}/${applicationId}/_elmu-info.json`;
    return JSON.parse(await this.cdn.getObjectAsString(elmuInfoFile, 'utf8'));
  }

  getMainLibraryForContent(manifest) {
    const mainLibName = manifest.mainLibrary;
    const mainDep = manifest.preloadedDependencies.find(dep => dep.machineName === mainLibName);
    return h5pHelper.dependencyToClientSideName(mainDep);
  }

  renderPlayTemplate(integration, h5pLibScripts, h5pLibStyles) {
    const element = React.createElement(H5pPlayerIframe, { integration, h5pLibScripts, h5pLibStyles });
    return `<!DOCTYPE html>${ReactDOMServer.renderToStaticMarkup(element)}`;
  }
}

module.exports = H5pPlayerRenderer;
