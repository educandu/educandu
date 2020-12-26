import React from 'react';
import PropTypes from 'prop-types';
import dimensions from 'react-dimensions';

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

export default dimensions()(DimensionsProvider);
