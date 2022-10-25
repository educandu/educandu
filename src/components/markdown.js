import React from 'react';
import PropTypes from 'prop-types';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';

function Markdown({ className, children, inline, renderAnchors, tag, ...rest }) {
  const gfm = useService(GithubFlavoredMarkdown);
  const { cdnRootUrl } = useService(ClientConfig);

  const Tag = tag || (inline ? 'span' : 'div');
  const classes = className ? `Markdown ${className}` : 'Markdown';

  if (typeof children !== 'string') {
    return <Tag className={classes} {...rest}>{children}</Tag>;
  }

  const html = inline
    ? gfm.renderInline(String(children), { cdnRootUrl })
    : gfm.render(String(children), { cdnRootUrl, renderAnchors, renderMedia: true });

  return <Tag className={classes} {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
}

Markdown.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  inline: PropTypes.bool,
  renderAnchors: PropTypes.bool,
  tag: PropTypes.string
};

Markdown.defaultProps = {
  children: null,
  className: '',
  inline: false,
  renderAnchors: false,
  tag: null
};

export default React.memo(Markdown);
