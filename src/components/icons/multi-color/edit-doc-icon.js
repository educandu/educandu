import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function EditDocIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#fff', stroke: '#2f2d7e', strokeWidth: '30', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M313.58 807.68H34.57m519.97-45.87 399.92-399.92c16.83-16.83 14.34-46.6-5.56-66.51l-86.34-86.34c-19.9-19.9-49.68-22.39-66.51-5.56L396.13 603.4l-37.55 174.66c-1.85 11.58 9.69 23.13 21.28 21.28l174.68-37.53zm312.88-390.58L582.79 655.87m74.39-146.19L543.91 622.95m-99.31 26.46 104.57 104.57m-117.64 31.34-58.93-58.94" />
    </svg>
  );
}

function EditDocIcon(props) {
  return (
    <Icon component={EditDocIconComponent} {...props} />
  );
}

export default EditDocIcon;
