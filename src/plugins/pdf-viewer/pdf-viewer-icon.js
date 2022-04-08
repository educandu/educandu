import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function PdfViewerIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2' }} d="M864.3 852.3c0 39.08-31.68 70.75-70.75 70.75H292.73c-39.08 0-70.75-31.68-70.75-70.75V144.51c0-39.08 31.68-70.75 70.75-70.75h364.8L864.3 289.59" />
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '39.8038', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M221.97 541.62V144.51c0-39.08 31.68-70.75 70.75-70.75h364.8L864.3 289.59V852.3c0 39.08-31.68 70.75-70.75 70.75H329.82" />
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '39.8038', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M645.26 84.59v146.03c0 40.1 32.51 72.61 72.61 72.61h136.84" />
      <path style={{ fill: '#666' }} d="M115.8 642.99c.31-12.92 8.18-23.64 22.05-23.64h66.77c49.48 0 71.51 35.6 71.51 71.2 0 35.91-22.04 70.89-71.51 70.89h-42.84v55.12c0 11.65-10.38 21.43-22.99 21.43-11.96 0-22.99-10.09-22.99-21.43V642.99zm45.98 16.99v61.13h40.64c17.98 0 27.42-16.39 27.42-30.56 0-13.55-8.82-30.56-26.15-30.56h-41.91zm182 176.42c-11.65 0-18.27-9.13-18.27-19.54V638.89c.31-10.72 6.62-19.54 18.27-19.54h66.79c62.38 0 97.98 47.25 97.98 109.01 0 61.42-35.6 108.05-97.98 108.05h-66.79zm27.74-40.32h39.05c34.66 0 51.98-32.13 51.98-67.73 0-35.91-17.31-68.37-51.98-68.37h-39.05v136.1zm309.57-176.73c10.38 0 18.89 9.13 18.89 20.47 0 10.4-8.82 19.85-18.89 20.16h-72.16v49.77h53.56c10.4 0 18.91 8.82 18.91 19.85 0 10.4-8.82 19.85-18.91 19.85h-53.56v67.1c0 11.65-10.38 21.43-22.99 21.43-11.96 0-22.99-10.09-22.99-21.43V638.89c.31-10.72 6.62-19.54 18.27-19.54h99.87z" />
    </svg>
  );
}

function PdfViewerIcon() {
  return (
    <Icon component={PdfViewerIconComponent} />
  );
}

export default PdfViewerIcon;
