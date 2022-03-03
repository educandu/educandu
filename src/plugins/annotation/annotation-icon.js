import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function AnnotationIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M749.4 388.77c-.03-.49-.1-.97-.15-1.45-.08-.74-.18-1.48-.28-2.23-.09-.58-.14-1.17-.25-1.75l-.03-.2-.02.01c-3.91-20.5-21.55-37.24-44.85-40.21l-2.57-.33c-19-2.42-36.97 4.94-48.22 17.91.25-25.32-20.27-47.04-47.78-49.49l-2.59-.23c-24.6-2.19-46.82 11.77-54.74 32.56-.34-26.95-23.83-48.71-52.8-48.71h-2.6c-29.18 0-52.83 22.07-52.83 49.3V69.8c0-27.23-23.65-49.3-52.83-49.3h-2.6c-29.18 0-52.83 22.07-52.83 49.3v481.65l-3.1-179.04c-21.27-2.2-15.07-2.71-41.64 8.54l-2.37 1c-26.57 11.25-38.14 37.43-33.31 65.23l14.19 198.89c3.55 49.71 25.37 96.58 61.96 130.39 19.19 17.74 35.08 37.6 35.08 67.24v135.8H687.2V841.26c0-60.79 0-75.12 21.46-127.7s37.56-171.93 38.46-229.62c.84-52.82 4.32-74.78 2.28-95.17zm-201.46-45.4v19.31m-108.28-20.22v19.31m129.07 547.29h112.49m-221.67 0h63.17" />
    </svg>
  );
}

function AnnotationIcon() {
  return (
    <Icon component={AnnotationIconComponent} />
  );
}

export default AnnotationIcon;
