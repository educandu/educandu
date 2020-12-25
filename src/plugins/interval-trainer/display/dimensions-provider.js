const React = require('react');
const PropTypes = require('prop-types');
const dimensions = require('react-dimensions');

/* eslint-disable-next-line react/prefer-stateless-function */
class DimensionsProvider extends React.Component {
  render() {
    const { children, containerWidth, containerHeight } = this.props;
    return (
      <div>{children({ containerWidth, containerHeight })}</div>
    );
  }
}

DimensionsProvider.propTypes = {
  children: PropTypes.func.isRequired,
  containerHeight: PropTypes.number.isRequired,
  containerWidth: PropTypes.number.isRequired
};

module.exports = dimensions()(DimensionsProvider);
