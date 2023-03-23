import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function CommentIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M292.26 217.98h415.48c77.22 0 139.81 62.6 139.81 139.81v227.7c0 77.22-62.6 139.81-139.81 139.81H420.26c-.83 0-1.6.32-2.15.94-35.32 39.57-92.48 103.94-109.19 122.76-1.78 2-5.05.83-5.23-1.84l-8.42-119.05a3.026 3.026 0 0 0-3.02-2.81v0c-77.21 0-139.81-62.59-139.81-139.81v-227.7c.01-77.21 62.6-139.81 139.82-139.81z" style={{ stroke: 'currentColor', strokeOpacity: 1, fill: 'none', strokeWidth: 30.00044227, strokeMiterlimit: 10, strokeDasharray: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }} transform="translate(-174.84 -213.263) scale(1.3489)" />
      <path style={{ stroke: 'currentColor', strokeOpacity: 1, fill: 'none', strokeWidth: 30, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="M264.19 425.5h249.64M264.19 559.63h471.62M264.19 490.7h78.2m72.27 0h319.6" transform="translate(-174.84 -213.263) scale(1.3489)" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <Icon component={CommentIconComponent} />
  );
}

export default CommentIcon;
