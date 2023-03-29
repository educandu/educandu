import by from 'thenby';
import PropTypes from 'prop-types';
import { Button, Spin } from 'antd';
import RoomCard from '../room-card.js';
import EmptyState from '../empty-state.js';
import { useUser } from '../user-context.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import RoomIcon from '../icons/general/room-icon.js';
import RoomCreationModal from '../room-creation-modal.js';
import React, { Fragment, useEffect, useState } from 'react';

function RoomsTab({ rooms, invitations, loading }) {
  const user = useUser();
  const { t } = useTranslation('roomsTab');

  const [filterText, setFilterText] = useState(null);
  const [displayedOwnedRooms, setDisplayedOwnedRooms] = useState([]);
  const [displayedInvitations, setDisplayedInvitations] = useState([]);
  const [displayedMemberOfRooms, setDisplayedMemberOfRooms] = useState([]);
  const [isRoomCreationModalOpen, setIsRoomCreationModalOpen] = useState(false);

  useEffect(() => {
    const lowerCasedFilter = (filterText || '').toLowerCase();

    const ownedRooms = rooms
      .filter(room => room.owner._id === user._id)
      .sort(by(room => room.createdOn));

    const filteredOwnedRooms = filterText
      ? ownedRooms.filter(room => room.name.toLowerCase().includes(lowerCasedFilter))
      : ownedRooms;

    const memberOfRooms = rooms
      .filter(room => room.owner._id !== user._id)
      .sort(by(room => room.members.find(member => member.userId === user._id).joinedOn));

    const filteredMemberOfRooms = filterText
      ? memberOfRooms.filter(room => room.name.toLowerCase().includes(lowerCasedFilter))
      : memberOfRooms;

    const filteredInvitations = filterText
      ? invitations.filter(invitation => invitation.room.name.toLowerCase().includes(lowerCasedFilter))
      : invitations;

    setDisplayedOwnedRooms(filteredOwnedRooms);
    setDisplayedMemberOfRooms(filteredMemberOfRooms);
    setDisplayedInvitations(filteredInvitations);
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

  const showEmptyState = !filterText && !displayedOwnedRooms.length && !displayedMemberOfRooms.length && !displayedInvitations.length;

  return (
    <div className="RoomsTab">
      {!!showEmptyState && (
        <EmptyState
          icon={<RoomIcon />}
          title={t('emptyStateTitle')}
          subtitle={t('emptyStateSubtitle')}
          action={{
            text: t('common:createRoom'),
            icon: <PlusOutlined />,
            onClick: handleCreateRoomClick
          }}
          />
      )}

      {!showEmptyState && (
        <Fragment>
          <Button className="RoomsTab-createRoomButton" type="primary" icon={<PlusOutlined />} onClick={handleCreateRoomClick}>
            {t('common:createRoom')}
          </Button>

          <div className="RoomsTab-filter">
            <FilterInput value={filterText} onChange={handleFilterTextChange} disabled={!!loading || !rooms.length} />
          </div>

          <div className="RoomsTab-roomsGroupHeadline">{t('ownedRoomsHeadline')}</div>
          <section className="RoomsTab-roomsGroup">
            {!!loading && <Spin className="u-spin" />}
            {!loading && displayedOwnedRooms.map(room => (<RoomCard key={room._id} room={room} />))}
            {!loading && !filterText && !displayedOwnedRooms.length && <div className="RoomsTab-noRoomsInGroup">{t('noOwnedRooms')}</div>}
            {!loading && !!filterText && !displayedOwnedRooms.length && <div className="RoomsTab-noRoomsInGroup">{t('noMatchingRooms')}</div>}
          </section>

          <div className="RoomsTab-roomsGroupHeadline">{t('memberRoomsHeadline')}</div>
          <section className="RoomsTab-roomsGroup">
            {!!loading && <Spin className="u-spin" />}
            {!loading && displayedMemberOfRooms.map(room => <RoomCard key={room._id} room={room} />)}
            {!loading && displayedInvitations.map(invitation => <RoomCard key={invitation._id} roomInvitation={invitation} />)}
            {!loading && !filterText && !displayedMemberOfRooms.length && !displayedInvitations.length && <div className="RoomsTab-noRoomsInGroup">{t('noMemberRooms')}</div>}
            {!loading && !!filterText && !displayedMemberOfRooms.length && !displayedInvitations.length && <div className="RoomsTab-noRoomsInGroup">{t('noMatchingRooms')}</div>}
          </section>

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
