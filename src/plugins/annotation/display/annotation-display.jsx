const React = require('react');
const Collapse = require('antd/lib/collapse');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

const { Panel } = Collapse;

class AnnotationDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  render() {
    const { content, githubFlavoredMarkdown } = this.props;
    const html = githubFlavoredMarkdown.render(content.text || '');

    return (
      <Collapse accordion>
        <Panel header={content.title} key="1">
          <p className="Annotation" dangerouslySetInnerHTML={{ __html: html }} />
        </Panel>
      </Collapse>
    );
  }
}

AnnotationDisplay.propTypes = {
  ...sectionDisplayProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, AnnotationDisplay);
