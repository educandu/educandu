import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function DocumentMarkedFavoriteIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{  enableBackground: 'new 0 0 1000 1000' }} >
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 60, strokeLinecap: 'round', strokeMiterlimit: 10  }} d="M705.84 636.95v108.13m-3.13 73.03v23.94c0 39.42-31.96 71.38-71.38 71.38H188.28c-39.42 0-71.38-31.96-71.38-71.38v-684.1c0-39.42 31.96-71.38 71.38-71.38h443.04c39.42 0 71.38 31.96 74.51 71.38v16.04" />
      <path d="M634.398 275.738a85.905 85.905 0 0 1 71.416 20.403l.53.472.486-.43a85.905 85.905 0 0 1 67.765-20.617l3.522.516a85.905 85.905 0 0 1 48.165 143.29l-2.578 2.648-.687.587-106.665 105.65a14.318 14.318 0 0 1-18.8 1.173l-1.345-1.174-107.281-106.264a85.905 85.905 0 0 1 45.472-146.254z" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'currentColor', strokeWidth: 14.3175,strokeOpacity: 1 }} />
    </svg>
  );
}

function DocumentMarkedFavoriteIcon(props) {
  return (
    <Icon component={DocumentMarkedFavoriteIconComponent} {...props} />
  );
}

export default DocumentMarkedFavoriteIcon;
