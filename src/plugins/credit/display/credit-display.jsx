const React = require('react');
const Collapse = require('antd/lib/collapse');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

const { Panel } = Collapse;

class CreditDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  render() {
    const { content, githubFlavoredMarkdown } = this.props;
    const html = githubFlavoredMarkdown.render(content.text || '');

    return (
      <Collapse accordion>
        <Panel header="Credits" key="1">
          <p className="Credit" dangerouslySetInnerHTML={{ __html: html }} />
        </Panel>
      </Collapse>
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
