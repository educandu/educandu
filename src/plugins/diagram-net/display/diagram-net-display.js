import dauria from 'dauria';
import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { sectionDisplayProps } from '../../../ui/default-prop-types';

function SvgImage({ maxWidth, svgXml }) {
  return (
    <img
      className={`DiagramNet-img u-max-width-${maxWidth}`}
      src={dauria.getBase64DataURI(Buffer.from(svgXml, 'utf8'), 'image/svg+xml')}
      />
  );
}

SvgImage.propTypes = {
  maxWidth: PropTypes.number.isRequired,
  svgXml: PropTypes.string.isRequired
};

const SvgImageMemoized = memo(SvgImage);

function DiagramNetDisplay({ content }) {
  return (
    <div className="DiagramNet">
      <SvgImageMemoized maxWidth={content.maxWidth || 100} svgXml={content.svgXml} />
    </div>
  );
}

DiagramNetDisplay.propTypes = {
  ...sectionDisplayProps
};

export default DiagramNetDisplay;
