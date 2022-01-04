import React from 'react';
import Markdown from '../../../components/markdown.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';

function MarkdownDisplay({ content }) {
  return <Markdown>{content.text}</Markdown>;
}

MarkdownDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MarkdownDisplay;
