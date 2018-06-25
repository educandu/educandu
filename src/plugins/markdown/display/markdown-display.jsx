const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

class MarkdownContentDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  render() {
    const { content, githubFlavoredMarkdown } = this.props;
    return (
      <div
        className="Markdown"
        dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content) }}
        />
    );
  }
}

MarkdownContentDisplay.propTypes = {
  ...sectionDisplayProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

const WrappedMarkdownContentDisplay = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, MarkdownContentDisplay);

// Wrapper:
/* eslint react/no-multi-comp: 0 */

function MarkdownDisplay({ preferredLanguages, section }) {
  const language = preferredLanguages[0];
  const content = section.content[language];

  return (
    <WrappedMarkdownContentDisplay content={content} language={language} />
  );
}

MarkdownDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = MarkdownDisplay;
