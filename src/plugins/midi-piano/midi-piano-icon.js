import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MidiPianoIconComponent() {
  return (
    <svg
      viewBox="0 0 1000 1000"
      style={{ enableBackground: 'new 0 0 1000 1000', width: '1.35em' }}
      >
      <g>
        <path
          style={{ fill: '#F2F2F2', stroke: '#666666', strokeWidth: 23.728, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }}
          d="M949.33,756.29H50.67c-19.5,0-35.31-15.81-35.31-35.31V279.02c0-19.5,15.81-35.31,35.31-35.31h898.66
          c19.5,0,35.31,15.81,35.31,35.31v441.97C984.64,740.48,968.83,756.29,949.33,756.29z"
          />
        <path
          style={{ fill: '#666666' }}
          d="M249.97,571.93h-83.51c-12.36,0-22.38-10.02-22.38-22.38V246.04h128.28v303.51
          C272.36,561.91,262.33,571.93,249.97,571.93z"
          />
        <path
          style={{ fill: '#666666' }}
          d="M443.91,571.93H360.4c-12.36,0-22.38-10.02-22.38-22.38V246.04h128.28v303.51
          C466.29,561.91,456.27,571.93,443.91,571.93z"
          />
        <path
          style={{ fill: '#666666' }}
          d="M831.27,571.93h-83.51c-12.36,0-22.38-10.02-22.38-22.38V246.04h128.28v303.51
            C853.65,561.91,843.63,571.93,831.27,571.93z"
          />
        <line style={{ fill: 'none', stroke: '#666666', strokeWidth: 23.728, strokeLinejoin: 'round', strokeMiterlimit: 10 }} x1="208.2" y1="242.69" x2="208.2" y2="766.2" />
        <line style={{ fill: 'none', stroke: '#666666', strokeWidth: 23.728, strokeLinejoin: 'round', strokeMiterlimit: 10 }} x1="402.04" y1="242.69" x2="402.04" y2="766.2" />
        <line style={{ fill: 'none', stroke: '#666666', strokeWidth: 23.728, strokeLinejoin: 'round', strokeMiterlimit: 10 }} x1="595.88" y1="242.69" x2="595.88" y2="766.2" />
        <line style={{ fill: 'none', stroke: '#666666', strokeWidth: 23.728, strokeLinejoin: 'round', strokeMiterlimit: 10 }} x1="789.73" y1="242.69" x2="789.73" y2="766.2" />
      </g>
    </svg>

  );
}

function MidiPianoIcon() {
  return (
    <Icon component={MidiPianoIconComponent} />
  );
}

export default MidiPianoIcon;
