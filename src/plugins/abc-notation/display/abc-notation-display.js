const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const abcjs = require('../../../common/abcjs-import');
const { inject } = require('../../../components/container-context');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

const abcOptions = {
  paddingtop: 0,
  paddingbottom: 0,
  paddingright: 0,
  paddingleft: 0,
  responsive: 'resize'
};

const midiOptions = {
  generateDownload: false,
  generateInline: true
};

class AbcNotationDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind(this);
    this.abcContainerRef = React.createRef();
    this.midiContainerRef = React.createRef();
  }

  componentDidMount() {
    const { content } = this.props;
    abcjs.renderAbc(this.abcContainerRef.current, content.abcCode, abcOptions);
    abcjs.renderMidi(this.midiContainerRef.current, content.abcCode, midiOptions);
  }

  render() {
    const { content, githubFlavoredMarkdown } = this.props;
    return (
      <div className="AbcNotation fa5">
        <div className={`AbcNotation-wrapper u-max-width-${content.maxWidth || 100}`}>
          <div ref={this.abcContainerRef} />
          {content.displayMidi && <div ref={this.midiContainerRef} />}
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
