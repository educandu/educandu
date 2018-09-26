const React = require('react');
const autoBind = require('auto-bind');
const urls = require('../../../utils/urls');
const { iframeResizer } = require('iframe-resizer');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

class H5pPlayerDisplay extends React.Component {
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

  ensureIframeIsSynced() {
    const currentIframe = this.iframeRef.current;
    if (currentIframe && currentIframe !== this.lastIframe) {
      this.iframeResizer = iframeResizer({ checkOrigin: false, inPageLinks: true }, currentIframe);
    }

    this.lastIframe = currentIframe;
  }

  renderPlayer({ applicationId, maxWidth }) {
    const pluginPrefix = urls.getPluginApiPathPrefix('h5p-player');
    const playUrl = urls.concatParts(pluginPrefix, 'play', applicationId);

    return (
      <div className={`H5pPlayer-contentFrameWrapper u-max-width-${maxWidth || 100}`}>
        <iframe className="H5pPlayer-contentFrame" src={playUrl} frameBorder="0" scrolling="no" ref={this.iframeRef} />
      </div>
    );
  }

  render() {
    const { content } = this.props;

    return (
      <div className="H5pPlayer">
        {content.applicationId && this.renderPlayer(content)}
      </div>
    );
  }
}

H5pPlayerDisplay.propTypes = {
  ...sectionDisplayProps
};

module.exports = H5pPlayerDisplay;
