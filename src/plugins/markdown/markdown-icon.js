import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MarkdownIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M766.99 162.5H233.01c-8.47 0-15.35 7.33-15.35 15.67v149.37c0 8.33 6.88 15.1 15.35 15.1h65.78c7.86 0 14.45-5.85 15.26-13.54l7.62-71.69h116.44v475.48l-87.25 9.82c-7.75.87-13.6 7.32-13.6 15v64.7c0 8.33 6.88 15.1 15.35 15.1h294.81c8.47 0 15.35-6.77 15.35-15.1v-64.7c0-7.69-5.88-14.15-13.64-15l-87.21-9.59V257.4h116.44l7.62 71.69c.81 7.69 7.4 13.54 15.26 13.54H767c8.47 0 15.35-6.77 15.35-15.1V177.6c-.01-8.34-6.89-15.1-15.36-15.1z" />
    </svg>
  );
}

function MarkdownIcon() {
  return (
    <Icon component={MarkdownIconComponent} />
  );
}

export default MarkdownIcon;
