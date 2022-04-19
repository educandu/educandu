import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function DiagramNetDisplay({ content }) {
  const { image, maxWidth } = content;
  return (
    <div className="DiagramNet">
      {image && <img className={`DiagramNet-img u-max-width-${maxWidth}`} src={image} />}
    </div>
  );
}

DiagramNetDisplay.propTypes = {
  ...sectionDisplayProps
};

export default DiagramNetDisplay;
