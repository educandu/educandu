import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function WikimediaCommonsIconComponent() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="1em"
      height="1em"
      viewBox="0 0 1000 1000"
      >
      <defs>
        <clipPath id="clippath">
          <circle cx="0" cy="0" r="298" />
        </clipPath>
      </defs>
      <g transform="translate(366.594 633.456) scale(1.23001)">
        <circle cx="108.459" r="100" fill="currentColor" />
        <g id="arrow" fill="currentColor" clipPath="url(#clippath)" transform="translate(108.46)">
          <path d="M-11 180v118h22V180" />
          <path d="M-43 185l43-75 43 75" />
        </g>
        <g id="arrows3" fill="currentColor" transform="translate(108.46)">
          <use width="100%" height="100%" transform="rotate(45 54.23 -130.922)" xlinkHref="#arrow" />
          <use width="100%" height="100%" transform="rotate(90 54.23 -54.23)" xlinkHref="#arrow" />
          <use width="100%" height="100%" transform="rotate(135 54.23 -22.463)" xlinkHref="#arrow" />
        </g>
        <use width="100%" height="100%" fill="currentColor" transform="matrix(-1 0 0 1 216.919 0)" xlinkHref="#arrows3" />
        <path fill="none" stroke="currentColor" strokeWidth="84" d="M-72.56-181.02a256 256 0 10362.039 0c-70.711-70.71-177.484-34.648-198.697-190.211" />
        <path fill="currentColor" d="M85.46-515s-36 135-80 185 116-62 170-5-90-180-90-180z" />
      </g>
    </svg>
  );
}

function WikimediaCommonsIcon(props) {
  return (
    <Icon component={WikimediaCommonsIconComponent} {...props} />
  );
}

export default WikimediaCommonsIcon;
