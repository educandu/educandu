const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const abcjs = require('../../../common/abcjs-import');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

const abcjsOptions = {
  paddingtop: 0,
  paddingbottom: 0,
  paddingright: 0,
  paddingleft: 0,
  responsive: 'resize'
};

class AbcNotationDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    const { content } = this.props;
    abcjs.renderAbc(this.containerRef.current, content.abcCode, abcjsOptions);
  }

  render() {
    const { content, githubFlavoredMarkdown } = this.props;
    return (
      <div className="AbcNotation">
        <div className={`AbcNotation-wrapper u-max-width-${content.maxWidth || 100}`}>
          <div ref={this.containerRef} />
          <div
            className="AbcNotation-copyrightInfo"
            dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.text || '') }}
            />
        </div>
      </div>
    );
  }
}

AbcNotationDisplay.propTypes = {
  ...sectionDisplayProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, AbcNotationDisplay);
