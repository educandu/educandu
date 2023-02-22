import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function TextIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M629.2 816.2H370.8c-16 0-29-13-29-29v-57.6c0-14.7 11-27.1 25.7-28.8l62.7-7.2V299.4h-72.6l-5.2 50c-1.5 14.8-13.9 26-28.8 26h-57.7c-16 0-29-13-29-29V213.2c0-16.3 13-29.5 29-29.5H734c16 0 29 13 29 29v133.6c0 16-13 29-29 29h-57.6c-14.9 0-27.3-11.2-28.8-26l-5.2-50h-72.6v394.5l62.7 7c14.7 1.6 25.8 14 25.8 28.8v57.6c-.1 16-13.1 29-29.1 29zm-256.4-31h254.3v-53.7l-74.6-8.3c-7.9-.9-13.8-7.5-13.8-15.4v-424c0-8.6 6.9-15.5 15.5-15.5h102.1c7.9 0 14.6 6 15.4 13.9l6.5 62H732V214.8H268v129.5h53.7l6.5-62c.8-7.9 7.5-13.9 15.4-13.9h102.1c8.6 0 15.5 6.9 15.5 15.5v423.7c0 7.9-5.9 14.5-13.8 15.4l-74.7 8.5v53.7zm361.3-570.4z" style={{ fill: 'currentColor' }} />
    </svg>
  );
}

function TextIcon() {
  return (
    <Icon component={TextIconComponent} />
  );
}

export default TextIcon;
