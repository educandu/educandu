import React, { memo } from 'react';

export function memoAndTransformProps(Component, transformProps) {
  const MemoizedComponent = memo(Component);
  return function MemoTransform(props) {
    return <MemoizedComponent {...transformProps(props)} />;
  };
}
