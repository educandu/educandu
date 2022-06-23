import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FilePdfIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <g style={{ display: 'inline' }}>
        <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M859.09 287.84v607.84c0 43.69-35.42 79.11-79.11 79.11H220.02c-43.69 0-79.11-35.42-79.11-79.11V104.32c0-43.69 35.42-79.11 79.11-79.11h385.24c14.46 0 28.3 5.91 38.3 16.35l200.78 209.59a52.995 52.995 0 0 1 14.75 36.69z" transform="translate(1.493 .225)" />
        <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M598.16 44.47V210.8c0 45.67 37.03 82.7 82.71 82.7h155.85" transform="translate(1.493 .225)" />
      </g>
      <g style={{ display: 'inline' }}>
        <path style={{ display: 'inline', fill: 'currentColor', strokeWidth: '1' }} d="M247.437 687.353c.269-11.106 7.028-20.318 18.962-20.318h57.404c42.541 0 61.483 30.607 61.483 61.214 0 30.875-18.942 60.944-61.483 60.944h-36.838v47.385c0 10.019-8.922 18.424-19.77 18.424-10.288 0-19.769-8.674-19.769-18.424V687.353Zm39.539 14.615v52.56h34.933c15.453 0 23.579-14.097 23.579-26.28 0-11.644-7.587-26.28-22.482-26.28zm160.599 151.678c-10.02 0-15.702-7.856-15.702-16.8V683.835c.27-9.212 5.693-16.799 15.702-16.799H505c53.627 0 84.244 40.626 84.244 93.725 0 52.808-30.607 92.896-84.244 92.896h-57.425zm23.848-34.664H505c29.8 0 44.684-27.626 44.684-58.233 0-30.875-14.884-58.78-44.684-58.78h-33.577z" transform="translate(-.855 -119.455)" />
        <path style={{ display: 'inline', fill: 'currentColor', strokeWidth: '2', strokeMiterlimit: '4', strokeDasharray: 'none' }} d="M741.697 667.035c8.922 0 16.24 7.856 16.24 17.607 0 8.942-7.587 17.068-16.24 17.337h-62.041v42.789h46.05c8.942 0 16.26 7.587 16.26 17.068 0 8.943-7.587 17.068-16.26 17.068h-46.05v57.694c0 10.02-8.922 18.424-19.77 18.424-10.288 0-19.77-8.673-19.77-18.424V683.834c.27-9.212 5.694-16.799 15.703-16.799z" transform="translate(-.855 -119.455)" />
      </g>
    </svg>
  );
}

function FilePdfIcon(props) {
  return (
    <Icon component={FilePdfIconComponent} {...props} />
  );
}

export default FilePdfIcon;
