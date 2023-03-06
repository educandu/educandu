import React from 'react';
import classNames from 'classnames';
import Markdown from '../../components/markdown.js';
import { COLOR_INTENSITY, TITLE_POSITION } from './constants.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function DividerDisplay({ content }) {
  const { title, titlePosition, colorIntensity, width } = content;

  const dividerClasses = classNames(
    'DividerDisplay',
    `u-width-${width}`,
    { 'DividerDisplay--noTitle': !title },
    { 'DividerDisplay--titleLeft': !!title && titlePosition === TITLE_POSITION.left },
    { 'DividerDisplay--titleRight': !!title && titlePosition === TITLE_POSITION.right }
  );

  const dividerLineClasses = classNames(
    'DividerDisplay-line',
    { 'DividerDisplay-line--light': colorIntensity === COLOR_INTENSITY.light },
    { 'DividerDisplay-line--dark': colorIntensity === COLOR_INTENSITY.dark }
  );

  return (
    <div className={dividerClasses}>
      <div className={dividerLineClasses} />
      {!!title && (
        <div className="DividerDisplay-title">
          <Markdown>{title}</Markdown>
        </div>
      )}
      <div className={dividerLineClasses} />
    </div>
  );
}

DividerDisplay.propTypes = {
  ...sectionDisplayProps
};

export default DividerDisplay;
