import React from 'react';
import classNames from 'classnames';
import { sectionDisplayProps } from '../../../ui/default-prop-types';

function IframeDisplay({ content }) {
  return (
    <div className="Iframe">
      <iframe
        src={content.url}
        style={{ height: `${content.height}px` }}
        className={classNames('Iframe-frame', { 'Iframe-frame--borderVisible': content.isBorderVisible }, `u-width-${content.width || 100}`)}
        />
    </div>
  );
}

IframeDisplay.propTypes = {
  ...sectionDisplayProps
};

export default IframeDisplay;
