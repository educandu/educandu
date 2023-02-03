import React from 'react';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

export default function MarkdownDisplay({ content }) {
  return (
    <Markdown renderAnchors className={`u-horizontally-centered u-width-${content.width}`}>
      {content.text}
    </Markdown>
  );
}

MarkdownDisplay.propTypes = {
  ...sectionDisplayProps
};
