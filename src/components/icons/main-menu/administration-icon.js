import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function AdministrationIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <circle cx={789.51} cy={500} r={114.48} style={{ fill: 'currentColor' }} />
      <circle cx={789.51} cy={882.52} r={114.48} style={{ fill: 'currentColor' }} />
      <circle cx={789.51} cy={117.48} r={114.48} style={{ fill: 'currentColor' }} />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 61.31, strokeMiterlimit: 10 }} d="M697.04 882.58h-150.9V117.42h146.93" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 61.31, strokeLinejoin: 'bevel', strokeMiterlimit: 10 }} d="M702.73 500H369.68" />
      <circle cx={250.26} cy={500} r={137.29} style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 61.31, strokeLinejoin: 'bevel', strokeMiterlimit: 10 }} />
    </svg>
  );
}

function AdministrationIcon() {
  return (
    <Icon component={AdministrationIconComponent} />
  );
}

export default AdministrationIcon;
