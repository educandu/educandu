const React = require('react');
const Markdown = require('../../../components/markdown');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

function MarkdownDisplay({ content }) {
  return <Markdown className="Markdown">{content.text}</Markdown>;
}

MarkdownDisplay.propTypes = {
  ...sectionDisplayProps
};

module.exports = MarkdownDisplay;
