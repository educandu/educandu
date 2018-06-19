const PropTypes = require('prop-types');
const React = require('react');

class AudioDisplay extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    const { preferredLanguages, section } = this.props;
    const data = section.content[preferredLanguages[0]];
    return (
      <div className="Audio">
        <audio src={data.src.url} controls />
      </div>
    );
  }
}

AudioDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = AudioDisplay;
