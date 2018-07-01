const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');

class HoverImage extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = { src: props.src };
  }

  handleMouseOver() {
    this.setState({ src: this.props.hoverSrc });
  }

  handleMouseOut() {
    this.setState({ src: this.props.src });
  }

  handleClick(e) {
    const { disabled, onClick } = this.props;
    return disabled || onClick(e);
  }

  render() {
    const { src } = this.state;
    const { imageClass } = this.props;
    return (
      <img
        src={src}
        className={imageClass}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        onClick={this.handleClick}
        />
    );
  }
}

HoverImage.propTypes = {
  disabled: PropTypes.bool,
  hoverSrc: PropTypes.string.isRequired,
  imageClass: PropTypes.string,
  onClick: PropTypes.func,
  src: PropTypes.string.isRequired
};

HoverImage.defaultProps = {
  disabled: false,
  imageClass: null,
  onClick: () => {}
};

module.exports = HoverImage;
