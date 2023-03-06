import React from 'react';
import classNames from 'classnames';
import Markdown from '../../components/markdown.js';
import { COLOR_INTENSITY, TITLE_POSITION } from './constants.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function SeparatorDisplay({ content }) {
  const { title, titlePosition, colorIntensity, width } = content;

  const separatorClasses = classNames(
    'SeparatorDisplay',
    `u-width-${width}`,
    { 'SeparatorDisplay--noTitle': !title },
    { 'SeparatorDisplay--titleLeft': !!title && titlePosition === TITLE_POSITION.left },
    { 'SeparatorDisplay--titleRight': !!title && titlePosition === TITLE_POSITION.right }
  );

  const separatorLineClasses = classNames(
    'SeparatorDisplay-line',
    { 'SeparatorDisplay-line--light': colorIntensity === COLOR_INTENSITY.light },
    { 'SeparatorDisplay-line--dark': colorIntensity === COLOR_INTENSITY.dark }
  );

  return (
    <div className={separatorClasses}>
      <div className={separatorLineClasses} />
      {!!title && (
        <div className="SeparatorDisplay-title">
          <Markdown>{title}</Markdown>
        </div>
      )}
      <div className={separatorLineClasses} />
    </div>
  );
}

SeparatorDisplay.propTypes = {
  ...sectionDisplayProps
};

export default SeparatorDisplay;
