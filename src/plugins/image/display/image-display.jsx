const React = require('react');
const PropTypes = require('prop-types');
const clientSettings = require('../../../bootstrap/client-settings');

class ImageDisplay extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    const { preferredLanguages, section } = this.props;
    const data = section.content[preferredLanguages[0]];

    let src;
    switch (data.src.type) {
      case 'external':
        src = data.src.url || null;
        break;
      case 'internal':
        src = data.src.url ? `${clientSettings.cdnRootURL}/${data.src.url}` : null;
        break;
      default:
        src = null;
        break;
    }

    return (
      <div className="Image">
        <img className="Image-img" src={src} />
      </div>
    );
  }
}

ImageDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = ImageDisplay;
