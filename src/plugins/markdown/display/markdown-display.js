import React from 'react';
import Markdown from '../../../components/markdown';
import { sectionDisplayProps } from '../../../ui/default-prop-types';

function MarkdownDisplay({ content }) {
  return <Markdown className="Markdown">{content.text}</Markdown>;
}

MarkdownDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MarkdownDisplay;
