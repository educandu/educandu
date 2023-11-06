import by from 'thenby';
import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import RoomCard from '../room-card.js';
import EmptyState from '../empty-state.js';
import { useUser } from '../user-context.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { Button, Switch, Tooltip } from 'antd';
import FilterIcon from '../icons/general/filter-icon.js';
import RoomCreationModal from '../room-creation-modal.js';
import React, { Fragment, useEffect, useState } from 'react';
import RoomJoinedIcon from '../icons/user-activities/room-joined-icon.js';
import RoomCreatedIcon from '../icons/user-activities/room-created-icon.js';
import { EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';

function RoomsTab({ rooms, invitations, loading }) {
  const user = useUser();

  const { t } = useTranslation('roomsTab');

  const [ownedRooms, setOwnedRooms] = useState([]);
  const [filterText, setFilterText] = useState(null);
  const [memberOfRooms, setMemberOfRooms] = useState([]);
  const [filteredOwnedRooms, setFilteredOwnedRooms] = useState([]);
  const [filteredInvitations, setFilteredInvitations] = useState([]);
  const [includeHiddenRooms, setIncludeHiddenRooms] = useState(false);
  const [filteredMemberOfRooms, setFilteredMemberOfRooms] = useState([]);
  const [isRoomCreationModalOpen, setIsRoomCreationModalOpen] = useState(false);

  useEffect(() => {
    const lowerCasedFilter = (filterText || '').toLowerCase();

    const newOwnedRooms = rooms
      .filter(room => room.ownedBy === user._id)
      .sort(by(room => room.createdOn));

    const newFilteredOwnedRooms = newOwnedRooms
      .filter(room => filterText ? room.name.toLowerCase().includes(lowerCasedFilter) : true)
      .filter(room => includeHiddenRooms ? true : !user.dashboardSettings.rooms.hiddenRooms.includes(room._id));

    const newMemberOfRooms = rooms
      .filter(room => room.ownedBy !== user._id)
      .sort(by(room => room.members.find(member => member.userId === user._id).joinedOn));

    const newFilteredMemberOfRooms = newMemberOfRooms
      .filter(room => filterText ? room.name.toLowerCase().includes(lowerCasedFilter) : true)
      .filter(room => includeHiddenRooms ? true : !user.dashboardSettings.rooms.hiddenRooms.includes(room._id));

    const newFilteredInvitations = filterText
      ? invitations.filter(invitation => invitation.room.name.toLowerCase().includes(lowerCasedFilter))
      : invitations;

    setOwnedRooms(newOwnedRooms);
    setMemberOfRooms(newMemberOfRooms);
    setFilteredOwnedRooms(newFilteredOwnedRooms);
    setFilteredMemberOfRooms(newFilteredMemberOfRooms);
    setFilteredInvitations(newFilteredInvitations);
  }, [user, rooms, invitations, filterText, includeHiddenRooms]);

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

  const handleIncludeHiddenRoomsChange = checked => {
    setIncludeHiddenRooms(checked);
  };

  const showOwnedRoomsEmptyState = !ownedRooms.length;
  const showMemberRoomsEmptyState = !memberOfRooms.length && !invitations.length;

  return (
    <div className="RoomsTab">
      {!!loading && <Spinner />}

      {!loading && (
        <Fragment>
          {!showOwnedRoomsEmptyState && (
            <div className="RoomsTab-controls">
              <div className="RoomsTab-filters">
                <FilterInput
                  className="RoomsTab-textFilter"
                  value={filterText}
                  onChange={handleFilterTextChange}
                  />
                <Tooltip title={includeHiddenRooms ? t('excludeHiddenRoomsTooltip') : t('includeHiddenRoomsTooltip')}>
                  <Switch
                    checkedChildren={<EyeOutlined />}
                    unCheckedChildren={<EyeInvisibleOutlined />}
                    checked={includeHiddenRooms}
                    onChange={handleIncludeHiddenRoomsChange}
                    />
                </Tooltip>
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
              button={{
                text: t('common:createRoom'),
                icon: <PlusOutlined />,
                onClick: handleCreateRoomClick
              }}
              />
          )}
          {!showOwnedRoomsEmptyState && (
            <section className="RoomsTab-roomsGroup">
              {filteredOwnedRooms.map(room => (
                <RoomCard key={room._id} room={room} useHidden />
              ))}
              {!filteredOwnedRooms.length && (
                <div className="RoomsTab-roomsGroupFilterEmptyState">
                  <EmptyState
                    icon={<FilterIcon />}
                    title={t('multipleFiltersResultEmptyStateTitle')}
                    subtitle={t('common:searchOrFilterResultEmptyStateSubtitle')}
                    />
                </div>
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
              {filteredMemberOfRooms.map(room => (
                <RoomCard key={room._id} room={room} useHidden />
              ))}
              {filteredInvitations.map(invitation => (
                <RoomCard key={invitation._id} roomInvitation={invitation} />
              ))}
              {!filteredMemberOfRooms.length && !filteredInvitations.length && (
                <div className="RoomsTab-roomsGroupFilterEmptyState">
                  <EmptyState
                    icon={<FilterIcon />}
                    title={t('multipleFiltersResultEmptyStateTitle')}
                    subtitle={t('common:searchOrFilterResultEmptyStateSubtitle')}
                    />
                </div>
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
