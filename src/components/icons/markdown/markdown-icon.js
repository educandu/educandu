import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MarkdownIconComponent() {
  return (
    <svg viewBox="0 0 1000 1000" width="1em" height="1em">
      <path d="M 7.790478,715.93708 V 284.06292 H 134.81229 L 261.8341,442.84019 388.85591,284.06292 H 515.87773 V 715.93708 H 388.85591 V 468.24455 L 261.8341,627.02181 134.81229,468.24455 v 247.69253 z m 793.886322,0 L 611.14409,506.35109 H 738.1659 V 284.06292 h 127.02181 v 222.28817 h 127.02181 z" fill="currentColor" strokeWidth="6" />
    </svg>
  );
}

function MarkdownIcon(props) {
  return (
    <Icon component={MarkdownIconComponent} {...props} />
  );
}

export default MarkdownIcon;
