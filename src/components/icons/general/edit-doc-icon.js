import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function EditDocIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 37.7953, strokeMiterlimit: 10, strokeDasharray: 'none', strokeOpacity: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }} d="M163.723 867.68H20.632" />
      <path d="m554.54 761.81 399.92-399.92c16.83-16.83 14.34-46.6-5.56-66.51l-86.34-86.34c-19.9-19.9-49.68-22.39-66.51-5.56L396.13 603.4l-37.55 174.66c-1.85 11.58 9.69 23.13 21.28 21.28zm312.88-390.58L582.79 655.87" style={{ stroke: 'currentColor', strokeOpacity: 1, fill: 'none', strokeWidth: 30, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} transform="translate(-231.552 -136.41) scale(1.25585)" />
      <path style={{ stroke: 'currentColor', strokeWidth: 29.9985, strokeMiterlimit: 10, strokeDasharray: 'none', strokeOpacity: 1, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }} d="M657.18 509.68 543.91 622.95" transform="translate(-231.552 -136.41) scale(1.25585)" />
      <path d="m444.6 649.41 104.57 104.57m-117.64 31.34-58.93-58.94" style={{ stroke: 'currentColor', strokeOpacity: 1, fill: 'none', strokeWidth: 30, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} transform="translate(-231.552 -136.41) scale(1.25585)" />
    </svg>
  );
}

function EditDocIcon() {
  return (
    <Icon component={EditDocIconComponent} />
  );
}

export default EditDocIcon;
