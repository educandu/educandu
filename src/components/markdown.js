import React from 'react';
import PropTypes from 'prop-types';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';

function Markdown({ className, children, inline, tag, ...rest }) {
  const gfm = useService(GithubFlavoredMarkdown);
  const { cdnRootUrl } = useService(ClientConfig);

  const Tag = tag || 'div';
  const renderMethod = inline ? 'renderInline' : 'render';
  const innerHtml = { __html: gfm[renderMethod](children, { cdnRootUrl, renderMedia: !inline }) };

  return typeof children === 'string'
    ? <Tag className={`Markdown ${className}`} {...rest} dangerouslySetInnerHTML={innerHtml} />
    : <Tag className={`Markdown ${className}`} {...rest}>{children}</Tag>;
}

Markdown.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  inline: PropTypes.bool,
  tag: PropTypes.string
};

Markdown.defaultProps = {
  children: null,
  className: '',
  inline: false,
  tag: 'div'
};

export default React.memo(Markdown);
