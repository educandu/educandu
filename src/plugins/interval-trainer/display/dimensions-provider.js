import React from 'react';
import PropTypes from 'prop-types';
import useDimensionsNs from 'react-cool-dimensions';

const useDimensions = useDimensionsNs.default || useDimensionsNs;

export default function DimensionsProvider({ children }) {
  const { observe, width, height } = useDimensions();
  return (
    <div ref={observe}>{children({ containerWidth: width, containerHeight: height })}</div>
  );
}

DimensionsProvider.propTypes = {
  children: PropTypes.func.isRequired
};
