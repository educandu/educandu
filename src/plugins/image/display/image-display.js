import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ClientConfig from '../../../bootstrap/client-config';
import { inject } from '../../../components/container-context';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown';
import { sectionDisplayProps, clientConfigProps } from '../../../ui/default-prop-types';

function getSource(type, url, cdnRootUrl) {
  switch (type) {
    case 'external':
      return url || null;
    case 'internal':
      return url ? `${cdnRootUrl}/${url}` : null;
    default:
      return null;
  }
}

function ImageDisplay({ content, clientConfig, githubFlavoredMarkdown }) {
  const hover = content.hover && (
    <div className="Image-secondary">
      <img
        className={`Image-img u-max-width-${content.maxWidth || 100}`}
        src={getSource(content.hover.type, content.hover.url, clientConfig.cdnRootUrl)}
        />
      <div
        className="Image-copyrightInfo"
        dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.hover.text || '') }}
        />
    </div>
  );
  return (
    <div className={classNames('Image', { 'Image--hoverable': content.hover })}>
      <div className="Image-primary">
        <img
          className={`Image-img u-max-width-${content.maxWidth || 100}`}
          src={getSource(content.type, content.url, clientConfig.cdnRootUrl)}
          />
        <div
          className="Image-copyrightInfo"
          dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.text || '') }}
          />
      </div>
      {hover}
    </div>
  );
}

ImageDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientConfigProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

export default inject({
  clientConfig: ClientConfig,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, ImageDisplay);
