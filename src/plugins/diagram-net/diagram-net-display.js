import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function DiagramNetDisplay({ content }) {
  const { image, width } = content;
  return (
    <div className="DiagramNetDisplay">
      {!!image && <img className={`DiagramNetDisplay-image u-width-${width}`} src={image} />}
    </div>
  );
}

DiagramNetDisplay.propTypes = {
  ...sectionDisplayProps
};

export default DiagramNetDisplay;
