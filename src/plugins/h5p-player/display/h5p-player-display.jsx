const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { iframeResizer } = require('iframe-resizer');

class H5pPlayerDisplay extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.contentFrame = React.createRef();
    this.lastIframe = this.contentFrame.current;
  }

  componentDidMount() {
    this.ensureIframeIsSynced();
  }

  shouldComponentUpdate() {
    return false;
  }

  componentDidUpdate() {
    this.ensureIframeIsSynced();
  }

  ensureIframeIsSynced() {
    const currentIframe = this.contentFrame.current;
    if (currentIframe !== this.lastIframe) {
      iframeResizer({ checkOrigin: false }, currentIframe);
    }

    this.lastIframe = currentIframe;
  }

  render() {
    const { preferredLanguages, section } = this.props;
    const data = section.content[preferredLanguages[0]];
    const playUrl = `/plugins/h5p-player/play/${data.contentId}`;
    return (
      <div className="H5pPlayer">
        <iframe className="H5pPlayer-contentFrame" src={playUrl} frameBorder="0" scrolling="no" ref={this.contentFrame} />
      </div>
    );
  }
}

H5pPlayerDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = H5pPlayerDisplay;
