import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function LessonCreatedIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M58.63 562.45V107.68c0-39.42 31.96-71.38 71.38-71.38h400.23M58.63 791.78v-166.6m697.52 62.04v108.14" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M753.02 868.38v23.94c0 39.42-31.96 71.38-71.38 71.38H238.6c-39.42 0-71.38-31.96-71.38-71.38v-684.1c0-39.42 31.96-71.38 71.38-71.38h443.04c39.42 0 71.38 31.96 74.51 71.38v16.04" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '81.1986', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M807.28 330.6v234.51m117.26-117.25H690.02" />
    </svg>
  );
}

function LessonCreatedIcon(props) {
  return (
    <Icon component={LessonCreatedIconComponent} {...props} />
  );
}

export default LessonCreatedIcon;
