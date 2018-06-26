const React = require('react');
const PropTypes = require('prop-types');
const htmlescape = require('htmlescape');

function H5pPlayerIframe({ h5pLibRootUrl, integration }) {
  const contentId = Object.values(integration.contents)[0].mainId;
  const inlineStyleBody = 'body { margin: 0; }';
  const integrationScriptBody = `window.H5PIntegration = ${htmlescape(integration)};`;

  return (
    <html>
      <head>
        <title>H5P Player</title>
        <script src="/scripts/iframeResizer.contentWindow.min.js" />
        <script src={`${h5pLibRootUrl}/js/jquery.js`} />
        <script src={`${h5pLibRootUrl}/js/h5p.js`} />
        <script src={`${h5pLibRootUrl}/js/h5p-event-dispatcher.js`} />
        <script src={`${h5pLibRootUrl}/js/h5p-x-api-event.js`} />
        <script src={`${h5pLibRootUrl}/js/h5p-x-api.js`} />
        <script src={`${h5pLibRootUrl}/js/h5p-content-type.js`} />
        <script src={`${h5pLibRootUrl}/js/h5p-confirmation-dialog.js`} />
        <script src={`${h5pLibRootUrl}/js/h5p-action-bar.js`} />
        <link rel="stylesheet" href={`${h5pLibRootUrl}/styles/h5p.css`} />
        <link rel="stylesheet" href={`${h5pLibRootUrl}/styles/h5p-confirmation-dialog.css`} />
        <link rel="stylesheet" href={`${h5pLibRootUrl}/styles/h5p-core-button.css`} />
        <style dangerouslySetInnerHTML={{ __html: inlineStyleBody }} />
      </head>
      <body>
        <div className="h5p-iframe-wrapper">
          <iframe
            id={`h5p-iframe-${contentId}`}
            className="h5p-iframe"
            data-content-id={contentId}
            style={{ height: '1px' }}
            src="about:blank"
            frameBorder="0"
            scrolling="no"
            />
        </div>
        <script dangerouslySetInnerHTML={{ __html: integrationScriptBody }} />
      </body>
    </html>
  );
}

H5pPlayerIframe.propTypes = {
  h5pLibRootUrl: PropTypes.string.isRequired,
  /* eslint-disable-next-line react/forbid-prop-types */
  integration: PropTypes.object.isRequired
};

module.exports = H5pPlayerIframe;
