import by from 'thenby';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import RoomCard from './room-card.js';
import React, { useState } from 'react';
import Restricted from './restricted.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import permissions from '../domain/permissions.js';
import { roomShape } from '../ui/default-prop-types.js';
import RoomCreationModal from './room-creation-modal.js';

function RoomsTab({ rooms }) {
  const user = useUser();
  const { t } = useTranslation('roomsTab');

  const ownedRooms = rooms.filter(room => room.owner._id === user._id)
    .sort(by(room => room.createdOn));

  const memberOfRooms = rooms.filter(room => room.owner._id !== user._id)
    .sort(by(room => room.members.find(member => member.userId === user._id).joinedOn));

  const [isRoomCreationModalVisible, setIsRoomCreationModalVisible] = useState(false);

  const handleCreateRoomClick = () => {
    setIsRoomCreationModalVisible(true);
  };

  const handleRoomCreationModalClose = () => {
    setIsRoomCreationModalVisible(false);
  };

  return (
    <div className="RoomsTab">
      <div className="RoomsTab-info">{t('info')}</div>
      <div className="RoomsTab-roomsGroupHeadline">{t('ownedRoomsHeadline')}</div>
      <section className="RoomsTab-roomsGroup">
        {ownedRooms.map(room => (<RoomCard key={room._id} room={room} />))}
        {!ownedRooms.length && <div className="RoomsTab-noRoomsInGroup">{t('noOwnedRooms')}</div>}
        <Restricted to={permissions.OWN_ROOMS}>
          <Button size="large" type="primary" shape="circle" icon={<PlusOutlined />} onClick={handleCreateRoomClick} />
        </Restricted>
      </section>

      <div className="RoomsTab-roomsGroupHeadline">{t('memberRoomsHeadline')}</div>
      <section className="RoomsTab-roomsGroup">
        {memberOfRooms.map(room => <RoomCard key={room._id} room={room} />)}
        {!memberOfRooms.length && <div className="RoomsTab-noRoomsInGroup">{t('noMemberRooms')}</div>}
      </section>

      <RoomCreationModal isVisible={isRoomCreationModalVisible} onClose={handleRoomCreationModalClose} />
    </div>
  );
}

RoomsTab.defaultProps = {
  rooms: []
};

RoomsTab.propTypes = {
  rooms: PropTypes.arrayOf(roomShape)
};

export default RoomsTab;
