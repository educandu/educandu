import React, { memo, useCallback, useState } from 'react';

export function memoAndTransformProps(Component, transformProps) {
  const MemoizedComponent = memo(Component);
  return function MemoTransformWrapper(props) {
    return <MemoizedComponent {...transformProps(props)} />;
  };
}

export function remountWhen(Component, eventName) {
  return function RemountWrapper(props) {
    const [key, setKey] = useState(0);
    const handleRemountTrigger = useCallback(() => {
      setKey(oldKey => oldKey + 1);
    }, [setKey]);
    const innerProps = {
      ...props,
      [eventName]: handleRemountTrigger,
      key
    };
    return <Component {...innerProps} />;
  };
}
