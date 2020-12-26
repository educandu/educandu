import React from 'react';
import PropTypes from 'prop-types';
import htmlescape from 'htmlescape';

function H5pPlayerIframe({ integration, h5pLibScripts, h5pLibStyles }) {
  const contentId = Object.values(integration.contents)[0].mainId;
  const inlineStyleBody = 'body { margin: 0; }';
  const integrationScriptBody = `window.H5PIntegration = ${htmlescape(integration)};`;

  return (
    <html>
      <head>
        <title>H5P Player</title>
        <script src="/scripts/iframeResizer.contentWindow.min.js" />
        {h5pLibScripts.map(s => <script key={s} src={s} />)}
        {h5pLibStyles.map(s => <link key={s} rel="stylesheet" href={s} />)}
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
  h5pLibScripts: PropTypes.arrayOf(PropTypes.string).isRequired,
  h5pLibStyles: PropTypes.arrayOf(PropTypes.string).isRequired,
  /* eslint-disable-next-line react/forbid-prop-types */
  integration: PropTypes.object.isRequired
};

export default H5pPlayerIframe;
