import React from 'react';
import PropTypes from 'prop-types';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';

function Markdown({ children, inline, renderMedia, tag, ...rest }) {
  const gfm = useService(GithubFlavoredMarkdown);
  const { cdnRootUrl } = useService(ClientConfig);

  const Tag = tag || 'div';

  return typeof children === 'string'
    ? <Tag className="Markdown" {...rest} dangerouslySetInnerHTML={{ __html: gfm[inline ? 'renderInline' : 'render'](children, { cdnRootUrl, renderMedia }) }} />
    : <Tag className="Markdown" {...rest}>{children}</Tag>;
}

Markdown.propTypes = {
  children: PropTypes.node,
  inline: PropTypes.bool,
  renderMedia: PropTypes.bool,
  tag: PropTypes.string
};

Markdown.defaultProps = {
  children: null,
  inline: false,
  renderMedia: false,
  tag: 'div'
};

export default React.memo(Markdown);
