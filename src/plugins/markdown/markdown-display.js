import React from 'react';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

export default function MarkdownDisplay({ content }) {
  return (
    <Markdown renderAnchors>{content.text}</Markdown>
  );
}

MarkdownDisplay.propTypes = {
  ...sectionDisplayProps
};
