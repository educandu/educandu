const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');
const { inject } = require('../../../components/container-context.jsx');
const PropTypes = require('prop-types');
const React = require('react');

function MarkdownDisplay({ githubFlavoredMarkdown, preferredLanguages, section }) {
  const markdownText = section.content[preferredLanguages[0]];
  return (
    <div
      className="Markdown"
      dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(markdownText) }}
      />
  );
}

MarkdownDisplay.propTypes = {
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired,
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, MarkdownDisplay);
