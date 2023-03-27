import PropTypes from 'prop-types';
import { roomMediaContextShape } from '../ui/default-prop-types.js';
import React, { useContext, useEffect, useMemo, useState } from 'react';

const RoomMediaContextContext = React.createContext();

export function useRoomMediaContext() {
  const context = useContext(RoomMediaContextContext);
  return context?.roomMediaContext;
}

export function useSetRoomMediaContext() {
  const context = useContext(RoomMediaContextContext);
  return context?.setRoomMediaContext;
}

export function RoomMediaContextProvider({ context, children }) {
  const [roomMediaContext, setRoomMediaContext] = useState(context);
  useEffect(() => setRoomMediaContext(context), [context]);
  const memoizedValue = useMemo(() => ({ roomMediaContext, setRoomMediaContext }), [roomMediaContext]);
  return (
    <RoomMediaContextContext.Provider value={memoizedValue}>
      {children}
    </RoomMediaContextContext.Provider>
  );
}

RoomMediaContextProvider.propTypes = {
  children: PropTypes.node,
  context: roomMediaContextShape
};

RoomMediaContextProvider.defaultProps = {
  children: null,
  context: null
};
