const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');
const PropTypes = require('prop-types');
const React = require('react');

/* eslint-disable no-warning-comments */

class MarkdownDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.gfm = new GithubFlavoredMarkdown(); // TODO Inject
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    const { preferredLanguages, section } = this.props;
    const markdown = section.content[preferredLanguages[0]];
    return (
      <div
        className="Markdown"
        dangerouslySetInnerHTML={{ __html: this.gfm.render(markdown) }}
        />
    );
  }
}

MarkdownDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = MarkdownDisplay;
