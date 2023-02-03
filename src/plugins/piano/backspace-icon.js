import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function BackspaceIconComponent() {
  return (
    <svg width="1em" height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} viewBox="0 0 1000 1000" >
      <path d="M911.9 862.53H367.73a43.56 43.56 0 0 1-32.76-14.86L55.34 528.37c-14.39-16.43-14.38-40.99.03-57.41L334.98 152.3a43.569 43.569 0 0 1 32.73-14.83H911.9c24.05 0 43.55 19.5 43.55 43.55v637.97c-.01 24.04-19.5 43.54-43.55 43.54zm-475.17-518.4 305.28 305.28m0-305.28L436.73 649.41" style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: 54.6161, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} />
    </svg>
  );
}

function BackspaceIcon() {
  return (
    <Icon component={BackspaceIconComponent} />
  );
}

export default BackspaceIcon;
