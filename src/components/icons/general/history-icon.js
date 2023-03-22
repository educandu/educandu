import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function HistoryIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M931.808 367.844c72.962 238.016-61.57 489.887-300.516 562.573-238.946 72.687-491.785-61.334-564.747-299.35-60.732-198.105 22.3-405.82 189.62-511.82 33.705-21.357 70.827-38.576 110.883-50.754 238.946-72.687 491.785 61.334 564.76 299.35Z" style={{ strokeWidth: 2, fill: 'none', fillOpacity: 1 }} />
      <path d="M256.165 119.26c33.705-21.357 70.827-38.576 110.883-50.754C605.98-4.18 858.833 129.84 931.795 367.856c72.962 238.017-61.57 489.888-300.516 562.574-238.946 72.687-491.785-61.334-564.747-299.35-40.907-133.458-16.578-271.263 54.8-379.396" style={{ strokeWidth: 45, strokeMiterlimit: 10, strokeDasharray: 'none', fill: 'none', fillOpacity: 1, stroke: 'currentColor', strokeOpacity: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      <path transform="translate(-163.484 -157.49) scale(1.30944)" style={{ fill: 'none', fillOpacity: 1, stroke: 'currentColor', strokeOpacity: 1, strokeWidth: 45, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="m326.64 154.08-24.14 65.54 68.06 16.65" />
      <path style={{ fill: 'none', fillOpacity: 1, stroke: 'currentColor', strokeOpacity: 1, strokeWidth: 45, strokeMiterlimit: 10, strokeDasharray: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }} d="M499.17 483.965V178.643m0 304.065L655.216 605.52" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <Icon component={HistoryIconComponent} />
  );
}

export default HistoryIcon;
