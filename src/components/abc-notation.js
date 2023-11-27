import abcjs from 'abcjs';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { useStableCallback } from '../ui/hooks.js';

const abcOptions = {
  paddingtop: 0,
  // Sometimes ABC renders outside on the bottom, so we add some extra space
  paddingbottom: 10,
  paddingright: 0,
  paddingleft: 0,
  responsive: 'resize'
};

function AbcNotation({ abcCode, onRender }) {
  const abcContainerRef = useRef();
  const onRenderStable = useStableCallback(onRender);

  useEffect(() => {
    onRenderStable(abcjs.renderAbc(abcContainerRef.current, abcCode, abcOptions));
  }, [abcCode, abcContainerRef, onRenderStable]);

  return (
    <div className="AbcNotation">
      <div className="AbcNotation-notes" ref={abcContainerRef} />
    </div>
  );
}

AbcNotation.propTypes = {
  abcCode: PropTypes.string,
  onRender: PropTypes.func
};

AbcNotation.defaultProps = {
  abcCode: '',
  onRender: () => {}
};

export default AbcNotation;
