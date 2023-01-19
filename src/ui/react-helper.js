import React, { memo } from 'react';

export function memoAndTransformProps(Component, transformProps) {
  const MemoizedComponent = memo(Component);
  return function MemoTransformWrapper(props) {
    return <MemoizedComponent {...transformProps(props)} />;
  };
}
