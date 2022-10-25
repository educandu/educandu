import React from 'react';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

export default function MarkdownWithImageDisplay({ content }) {
  return (
    <Markdown renderAnchors>{content.text}</Markdown>
  );
}

MarkdownWithImageDisplay.propTypes = {
  ...sectionDisplayProps
};
