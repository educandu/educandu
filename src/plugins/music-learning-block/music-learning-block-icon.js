import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MusicLearningBlockIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M509.91 186.64H243.35c-26.95 0-50.76 17.54-58.74 43.28L25.51 599.2v277.18c0 33.96 27.53 61.5 61.5 61.5h825.98c33.96 0 61.5-27.53 61.5-61.5V599.2l-159.1-369.27c-7.98-25.74-31.79-43.28-58.74-43.28h-28.69" style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: 41.5214, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} />
      <path d="M964.09 599.11H616.85c-11.05 54.43-59.16 95.4-116.85 95.4s-105.8-40.97-116.85-95.4H35.9" style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: 41.5214, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} />
      <ellipse transform="rotate(-22.711 514.622 404.957)" cx={514.67} cy={404.99} rx={132.62} ry={88.41} style={{ fill: '#666' }} />
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: 41.5214, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="M620.77 377.34V62.12" />
    </svg>
  );
}

function MusicLearningBlockIcon() {
  return (
    <Icon component={MusicLearningBlockIconComponent} />
  );
}

export default MusicLearningBlockIcon;
