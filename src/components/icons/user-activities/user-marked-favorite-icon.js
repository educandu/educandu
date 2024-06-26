import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function UserMarkedFavoriteIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{  enableBackground: 'new 0 0 1000 1000' }} >
      <g style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'currentColor', strokeWidth: 23.87125364, strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1 }}>
        <path d="M518.188 999.5c-67.42 0-132.84-13.21-194.43-39.26-59.48-25.16-112.9-61.17-158.77-107.04-45.87-45.87-81.88-99.28-107.04-158.77-26.05-61.59-39.26-127.01-39.26-194.43s13.21-132.84 39.26-194.43c25.16-59.48 61.17-112.9 107.04-158.77 45.87-45.87 99.28-81.88 158.77-107.04C385.348 13.71 450.768.5 518.188.5c65.607 0 129.782 12.805 189.29 37.168 53.108 21.744 102.498 52.693 145.87 91.962 9.34 8.46 10.06 22.89 1.6 32.24-8.46 9.35-14.25 10.06-23.6 1.6-83.56-75.66-191.7-117.33-304.52-117.33-61.28 0-129.36 12-185.29 35.66-54.04 22.86-102.583 55.588-144.27 97.27-41.693 41.688-74.42 90.23-97.27 144.27-23.67 55.94-35.67 115.38-35.67 176.66s12 120.72 35.66 176.65c22.86 54.04 55.59 102.58 97.27 144.27 41.69 41.69 90.23 74.42 144.27 97.27 55.94 23.66 115.37 35.66 176.65 35.66s120.72-12 176.65-35.66c54.04-22.86 102.58-55.59 144.27-97.27 41.69-41.69 74.42-90.23 97.27-144.27 13.748-22.656 50.365-26.286 42.04 17.77-25.16 59.48-61.17 112.9-107.04 158.77-45.87 45.87-99.28 81.88-158.76 107.04-61.58 26.06-127 39.27-194.42 39.27z" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'currentColor', strokeWidth: 23.8713, strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1, paintOrder: 'markers stroke fill' }} transform="matrix(.83121 0 0 .8445 30.084 79.427)" />
      </g>
      <g style={{ strokeWidth: 25, strokeMiterlimit: 4, strokeDasharray: 'none'  }}>
        <circle cx={493.862} cy={445.814} style={{ strokeWidth: 25.8786, strokeMiterlimit: 4, strokeDasharray: 'none', fill: 'currentColor' }} r={156.309} transform="matrix(.83121 0 0 .8445 36.084 79.427)" />
      </g>
      <g style={{ strokeWidth: 25, strokeMiterlimit: 4, strokeDasharray: 'none' }}>
        <path d="M493.862 951.2c106.06 0 202.743-39.981 275.932-105.634l-25.836-64.525c-33.997-84.88-116.223-140.524-207.66-140.524h-84.88c-91.428 0-173.663 55.644-207.66 140.524l-25.836 64.525C291.11 911.22 387.803 951.2 493.862 951.2z" style={{ strokeWidth: 25.8786, strokeMiterlimit: 4, strokeDasharray: 'none', fill: 'currentColor' }} transform="matrix(.9738 0 0 .8445 -32.336 79.427)" />
      </g>
      <path d="M755.455 296.798a85.905 85.905 0 0 1 71.416 20.403l.53.472.487-.43a85.905 85.905 0 0 1 67.765-20.617l3.522.516a85.905 85.905 0 0 1 48.164 143.29l-2.577 2.648-.688.587-106.665 105.65a14.318 14.318 0 0 1-18.799 1.173l-1.346-1.174-107.281-106.264a85.905 85.905 0 0 1 45.472-146.254z" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'currentColor', strokeWidth: 14.3175, strokeOpacity: 1 }} />
    </svg>
  );
}

function UserMarkedFavoriteIcon() {
  return (
    <Icon component={UserMarkedFavoriteIconComponent} />
  );
}

export default UserMarkedFavoriteIcon;
