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
import React, { Fragment, useMemo, useState } from 'react';
import RoomJoinedIcon from '../icons/user-activities/room-joined-icon.js';
import RoomCreatedIcon from '../icons/user-activities/room-created-icon.js';
import { roomInvitationShape, roomShape } from '../../ui/default-prop-types.js';
import { EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';

function RoomsTab({ rooms, roomInvitations, loading }) {
  const user = useUser();

  const { t } = useTranslation('roomsTab');

  const [filterText, setFilterText] = useState('');
  const [includeHiddenRooms, setIncludeHiddenRooms] = useState(false);
  const [isRoomCreationModalOpen, setIsRoomCreationModalOpen] = useState(false);

  const displayData = useMemo(() => {
    const lowerCasedFilter = (filterText || '').toLowerCase().trim();
    const hiddenRoomIds = new Set((!includeHiddenRooms && user.dashboardSettings.rooms.hiddenRooms) || []);

    const ownedRooms = rooms
      .filter(room => room.ownedBy === user._id)
      .sort(by(room => room.createdOn));

    const filteredOwnedRooms = ownedRooms
      .filter(room => room.name.toLowerCase().includes(lowerCasedFilter) && !hiddenRoomIds.has(room._id));

    const memberOfRooms = rooms
      .filter(room => room.ownedBy !== user._id)
      .sort(by(room => room.members.find(member => member.userId === user._id).joinedOn));

    const filteredMemberOfRooms = memberOfRooms
      .filter(room => room.name.toLowerCase().includes(lowerCasedFilter) && !hiddenRoomIds.has(room._id));

    const filteredRoomInvitations = roomInvitations
      .filter(invitation => invitation.room.name.toLowerCase().includes(lowerCasedFilter));

    return {
      ownedRooms,
      memberOfRooms,
      filteredOwnedRooms,
      filteredMemberOfRooms,
      filteredRoomInvitations
    };
  }, [rooms, roomInvitations, filterText, includeHiddenRooms, user]);

  const handleCreateRoomClick = () => {
    setIsRoomCreationModalOpen(true);
  };

  const handleRoomCreationModalClose = () => {
    setIsRoomCreationModalOpen(false);
  };

  const handleFilterTextChange = event => {
    setFilterText(event.target.value);
  };

  const handleIncludeHiddenRoomsChange = checked => {
    setIncludeHiddenRooms(checked);
  };

  const showOwnedRoomsEmptyState = !displayData.ownedRooms.length;
  const showMemberRoomsEmptyState = !displayData.memberOfRooms.length && !roomInvitations.length;

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
              {displayData.filteredOwnedRooms.map(room => (
                <RoomCard key={room._id} room={room} useHidden />
              ))}
              {!displayData.filteredOwnedRooms.length && (
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
              {displayData.filteredMemberOfRooms.map(room => (
                <RoomCard key={room._id} room={room} useHidden />
              ))}
              {displayData.filteredRoomInvitations.map(invitation => (
                <RoomCard key={invitation._id} roomInvitation={invitation} />
              ))}
              {!displayData.filteredMemberOfRooms.length && !displayData.filteredRoomInvitations.length && (
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

RoomsTab.propTypes = {
  loading: PropTypes.bool.isRequired,
  rooms: PropTypes.arrayOf(roomShape),
  roomInvitations: PropTypes.arrayOf(roomInvitationShape)
};

RoomsTab.defaultProps = {
  rooms: [],
  roomInvitations: []
};

export default RoomsTab;
