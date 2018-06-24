const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');

class H5pPlayerDisplay extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.contentFrame = React.createRef();
  }

  componentDidMount() {
    const { preferredLanguages, section } = this.props;
    const data = section.content[preferredLanguages[0]];
    const playUrl = `/plugins/h5p-player/play/${data.contentId}`;

    fetch(playUrl).then(x => x.text()).then(html => {
      const iframe = this.contentFrame.current;
      iframe.onload = () => {
        iframe.style.height = `${iframe.contentWindow.document.body.scrollHeight}px`;
      };
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(html);
      iframe.contentWindow.document.close();
    });
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <div className="H5pPlayer">
        <iframe className="H5pPlayer-contentFrame" frameBorder="0" scrolling="no" ref={this.contentFrame} />
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
