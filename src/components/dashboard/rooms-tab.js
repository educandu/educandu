import by from 'thenby';
import PropTypes from 'prop-types';
import { Button, Spin } from 'antd';
import RoomCard from '../room-card.js';
import React, { useState } from 'react';
import Restricted from '../restricted.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import permissions from '../../domain/permissions.js';
import RoomCreationModal from '../room-creation-modal.js';

function RoomsTab({ rooms, invitations, loading }) {
  const user = useUser();
  const { t } = useTranslation('roomsTab');

  const ownedRooms = rooms.filter(room => room.owner._id === user._id)
    .sort(by(room => room.createdOn));

  const memberOfRooms = rooms.filter(room => room.owner._id !== user._id)
    .sort(by(room => room.members.find(member => member.userId === user._id).joinedOn));

  const [isRoomCreationModalOpen, setIsRoomCreationModalOpen] = useState(false);

  const handleCreateRoomClick = () => {
    setIsRoomCreationModalOpen(true);
  };

  const handleRoomCreationModalClose = () => {
    setIsRoomCreationModalOpen(false);
  };

  return (
    <div className="RoomsTab">
      <div className="RoomsTab-info">{t('info')}</div>

      <Restricted to={permissions.OWN_ROOMS}>
        <Button className="RoomsTab-createRoomButton" type="primary" onClick={handleCreateRoomClick}>
          {t('common:createRoom')}
        </Button>
      </Restricted>

      <div className="RoomsTab-roomsGroupHeadline">{t('ownedRoomsHeadline')}</div>
      <section className="RoomsTab-roomsGroup">
        {!!loading && <Spin className="u-spin" />}
        {!loading && ownedRooms.map(room => (<RoomCard key={room._id} room={room} />))}
        {!loading && !ownedRooms.length && <div className="RoomsTab-noRoomsInGroup">{t('noOwnedRooms')}</div>}
      </section>

      <div className="RoomsTab-roomsGroupHeadline">{t('memberRoomsHeadline')}</div>
      <section className="RoomsTab-roomsGroup">
        {!!loading && <Spin className="u-spin" />}
        {!loading && memberOfRooms.map(room => <RoomCard key={room._id} room={room} />)}
        {!loading && invitations.map(invitation => <RoomCard key={invitation._id} room={invitation.room} invitation={invitation} />)}
        {!loading && !memberOfRooms.length && !invitations.length && <div className="RoomsTab-noRoomsInGroup">{t('noMemberRooms')}</div>}
      </section>

      <RoomCreationModal isOpen={isRoomCreationModalOpen} onClose={handleRoomCreationModalClose} />
    </div>
  );
}

RoomsTab.defaultProps = {
  invitations: [],
  rooms: []
};

RoomsTab.propTypes = {
  invitations: PropTypes.arrayOf(PropTypes.object),
  rooms: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool.isRequired
};

export default RoomsTab;
