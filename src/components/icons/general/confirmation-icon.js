import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function ConfirmationIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2' }} d="M933.66 500c0 239.51-194.16 433.66-433.66 433.66S66.34 739.51 66.34 500 260.49 66.34 500 66.34c71.97 0 139.85 17.53 199.6 48.56 75.74 39.34 138.41 100.37 179.78 174.86 34.59 62.27 54.28 133.95 54.28 210.24z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M928.21 431c3.59 22.47 5.46 45.52 5.46 69 0 239.51-194.16 433.66-433.66 433.66S66.34 739.51 66.34 500 260.49 66.34 500 66.34c71.97 0 139.85 17.53 199.6 48.56m125.06 97.59c20.92 23.6 39.3 49.5 54.72 77.27a431.007 431.007 0 0 1 25.94 55.71" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '55', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M681.2 335.44 462.9 673.07 345.88 516.13" />
    </svg>
  );
}

function ConfirmationIcon() {
  return (
    <Icon component={ConfirmationIconComponent} />
  );
}

export default ConfirmationIcon;
