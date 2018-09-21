const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

class CreditDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  render() {
    const { content, githubFlavoredMarkdown } = this.props;
    const html = githubFlavoredMarkdown.render(content.text);

    return (
      <div
        className="Credit"
        dangerouslySetInnerHTML={{ __html: html }}
        />
    );
  }
}

CreditDisplay.propTypes = {
  ...sectionDisplayProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, CreditDisplay);
