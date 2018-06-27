const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

class MarkdownDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  render() {
    const { content, githubFlavoredMarkdown } = this.props;
    const html = githubFlavoredMarkdown.render(content.text);

    return (
      <div
        className="Markdown"
        dangerouslySetInnerHTML={{ __html: html }}
        />
    );
  }
}

MarkdownDisplay.propTypes = {
  ...sectionDisplayProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, MarkdownDisplay);
