import React from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

export default function TestDisplay({ content }) {
  return (
    <div>{content.text}</div>
  );
}

TestDisplay.propTypes = {
  ...sectionDisplayProps
};
