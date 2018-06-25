const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { iframeResizer } = require('iframe-resizer');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

class H5pPlayerContentDisplay extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.iframeResizer = null;
    this.iframeRef = React.createRef();
    this.lastIframe = this.iframeRef.current;
  }

  componentDidMount() {
    this.ensureIframeIsSynced();
  }

  componentDidUpdate() {
    this.ensureIframeIsSynced();
  }

  componentWillUnmount() {
    this.ensureCurrentIframeIsClosed();
  }

  ensureCurrentIframeIsClosed() {
    if (this.iframeResizer) {
      this.iframeResizer.close();
      this.iframeResizer = null;
    }
  }

  ensureIframeIsSynced() {
    const currentIframe = this.iframeRef.current;
    if (currentIframe !== this.lastIframe) {
      this.ensureCurrentIframeIsClosed();
      this.iframeResizer = iframeResizer({ checkOrigin: false, inPageLinks: true }, currentIframe);
    }

    this.lastIframe = currentIframe;
  }

  render() {
    const { content } = this.props;
    const playUrl = `/plugins/h5p-player/play/${content.contentId}`;
    return (
      <div className="H5pPlayer">
        <div className={`H5pPlayer-contentFrameWrapper u-max-width-${content.maxWidth || 100}`}>
          <iframe className="H5pPlayer-contentFrame" src={playUrl} frameBorder="0" scrolling="no" ref={this.iframeRef} />
        </div>
      </div>
    );
  }
}

H5pPlayerContentDisplay.propTypes = {
  ...sectionDisplayProps
};

// Wrapper:
/* eslint react/no-multi-comp: 0 */

function H5pPlayerDisplay({ preferredLanguages, section }) {
  const language = preferredLanguages[0];
  const content = section.content[language];

  return (
    <H5pPlayerContentDisplay content={content} language={language} />
  );
}

H5pPlayerDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = H5pPlayerDisplay;
