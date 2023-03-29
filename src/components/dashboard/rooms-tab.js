import by from 'thenby';
import PropTypes from 'prop-types';
import { Button, Spin } from 'antd';
import RoomCard from '../room-card.js';
import EmptyState from '../empty-state.js';
import { useUser } from '../user-context.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import RoomCreationModal from '../room-creation-modal.js';
import React, { Fragment, useEffect, useState } from 'react';
import RoomJoinedIcon from '../icons/user-activities/room-joined-icon.js';
import RoomCreatedIcon from '../icons/user-activities/room-created-icon.js';

function RoomsTab({ rooms, invitations, loading }) {
  const user = useUser();
  const { t } = useTranslation('roomsTab');

  const [filterText, setFilterText] = useState(null);
  const [ownedRooms, setOwnedRooms] = useState([]);
  const [memberOfRooms, setMemberOfRooms] = useState([]);
  const [filteredOwnedRooms, setFilteredOwnedRooms] = useState([]);
  const [filteredInvitations, setFilteredInvitations] = useState([]);
  const [filteredMemberOfRooms, setFilteredMemberOfRooms] = useState([]);
  const [isRoomCreationModalOpen, setIsRoomCreationModalOpen] = useState(false);

  useEffect(() => {
    const lowerCasedFilter = (filterText || '').toLowerCase();

    const newOwnedRooms = rooms
      .filter(room => room.owner._id === user._id)
      .sort(by(room => room.createdOn));

    const newFilteredOwnedRooms = filterText
      ? newOwnedRooms.filter(room => room.name.toLowerCase().includes(lowerCasedFilter))
      : newOwnedRooms;

    const newMemberOfRooms = rooms
      .filter(room => room.owner._id !== user._id)
      .sort(by(room => room.members.find(member => member.userId === user._id).joinedOn));

    const newFilteredMemberOfRooms = filterText
      ? newMemberOfRooms.filter(room => room.name.toLowerCase().includes(lowerCasedFilter))
      : newMemberOfRooms;

    const newFilteredInvitations = filterText
      ? invitations.filter(invitation => invitation.room.name.toLowerCase().includes(lowerCasedFilter))
      : invitations;

    setOwnedRooms(newOwnedRooms);
    setMemberOfRooms(newMemberOfRooms);
    setFilteredOwnedRooms(newFilteredOwnedRooms);
    setFilteredMemberOfRooms(newFilteredMemberOfRooms);
    setFilteredInvitations(newFilteredInvitations);
  }, [user, rooms, invitations, filterText]);

  const handleCreateRoomClick = () => {
    setIsRoomCreationModalOpen(true);
  };

  const handleRoomCreationModalClose = () => {
    setIsRoomCreationModalOpen(false);
  };

  const handleFilterTextChange = event => {
    const { value } = event.target;
    setFilterText(value);
  };

  const showOwnedRoomsEmptyState = !ownedRooms.length;
  const showMemberRoomsEmptyState = !memberOfRooms.length && !invitations.length;

  return (
    <div className="RoomsTab">
      {!!loading && <Spin className="u-spin" />}

      {!loading && (
        <Fragment>
          {!showOwnedRoomsEmptyState && (
            <div className="RoomsTab-controls">
              <div className="RoomsTab-filter">
                <FilterInput value={filterText} onChange={handleFilterTextChange} />
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRoomClick}>
                {t('common:createRoom')}
              </Button>
            </div>
          )}

          <div className="RoomsTab-roomsGroupHeadline">{t('ownedRoomsHeadline')}</div>
          {!!showOwnedRoomsEmptyState && (
            <EmptyState
              icon={<RoomCreatedIcon />}
              title={t('ownedRoomsEmptyStateTitle')}
              subtitle={t('ownedRoomsEmptyStateSubtitle')}
              action={{
                text: t('common:createRoom'),
                icon: <PlusOutlined />,
                onClick: handleCreateRoomClick
              }}
              />
          )}
          {!showOwnedRoomsEmptyState && (
            <section className="RoomsTab-roomsGroup">
              {filteredOwnedRooms.map(room => (<RoomCard key={room._id} room={room} />))}
              {!filteredOwnedRooms.length && (
                <div className="RoomsTab-noMatch">{t('noMatchingRooms')}</div>
              )}
            </section>
          )}

          <div className="RoomsTab-roomsGroupHeadline">{t('memberRoomsHeadline')}</div>
          {!!showMemberRoomsEmptyState && (
            <EmptyState
              icon={<RoomJoinedIcon />}
              title={t('memberRoomsEmptyStateTitle')}
              subtitle={t('memberRoomsEmptyStateSubtitle')}
              />
          )}
          {!showMemberRoomsEmptyState && (
            <section className="RoomsTab-roomsGroup">
              {filteredMemberOfRooms.map(room => <RoomCard key={room._id} room={room} />)}
              {filteredInvitations.map(invitation => <RoomCard key={invitation._id} roomInvitation={invitation} />)}
              {!filteredMemberOfRooms.length && !filteredInvitations.length && (
                <div className="RoomsTab-noMatch">{t('noMatchingRooms')}</div>
              )}
            </section>
          )}
        </Fragment>
      )}

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
