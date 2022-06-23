import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function HomeIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M918.28 433.05 508.62 42.41c-12.26-11.7-31.2-11.38-43.11.71L80.9 433.86c-24.77 25.16-10.26 74.53 21.91 74.53h60.03v437.84c0 11 8.6 19.93 19.2 19.93h187.34c10.6 0 19.2-8.92 19.2-19.93V735.8c0-21.85 17.07-39.56 38.12-39.56h146.6c21.05 0 38.12 17.71 38.12 39.56v210.44c0 11 8.6 19.93 19.2 19.93h187.35c10.6 0 19.2-8.92 19.2-19.93V508.39h60.02c32.7 0 46.9-50.73 21.09-75.34z" />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <Icon component={HomeIconComponent} {...props} />
  );
}

export default HomeIcon;
