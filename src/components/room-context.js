import PropTypes from 'prop-types';
import React, { useContext, useEffect, useMemo, useState } from 'react';

const RoomContext = React.createContext();

export function useRoomId() {
  const { roomId } = useContext(RoomContext);
  return roomId;
}

export function useSetRoomId() {
  const { setRoomId } = useContext(RoomContext);
  return setRoomId;
}

export function RoomProvider({ value, children }) {
  const [roomId, setRoomId] = useState(value);
  useEffect(() => setRoomId(value), [value]);
  const contextValue = useMemo(() => ({ roomId, setRoomId }), [roomId]);
  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
}

RoomProvider.propTypes = {
  value: PropTypes.string,
  children: PropTypes.node
};

RoomProvider.defaultProps = {
  value: null,
  children: null
};
