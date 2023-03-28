import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { Card, Tooltip } from 'antd';
import routes from '../utils/routes.js';
import { useUser } from './user-context.js';
import FavoriteStar from './favorite-star.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { InfoCircleOutlined, MailOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { favoriteRoomShape, roomInvitationBasicShape, roomShape } from '../ui/default-prop-types.js';

function RoomCard({ room, favoriteRoom, roomInvitation, onToggleFavorite }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomCard');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const userAccessibleRoom = room || favoriteRoom?.data;
  const isDeletedRoom = !userAccessibleRoom && !roomInvitation?.room;
  const roomId = room?._id || favoriteRoom?.id || roomInvitation?.room?._id;

  const handleCardClick = () => {
    if (userAccessibleRoom) {
      window.location = routes.getRoomUrl(roomId);
    }
  };

  const handleAcceptInvitationClick = async () => {
    await roomApiClient.confirmInvitation({ token: roomInvitation.token });
    window.location = routes.getRoomUrl(roomId);
  };

  const renderTitle = () => {
    const roomName = room?.name || favoriteRoom?.data?.name || roomInvitation?.room?.name;
    const title = isDeletedRoom ? t('common:roomNotAvailable') : roomName;

    const classes = classNames(
      'RoomCard-title',
      { 'RoomCard-title--deletedRoom': isDeletedRoom },
      { 'RoomCard-title--disabledNavigation': !userAccessibleRoom }
    );

    return (
      <div className={classes} onClick={handleCardClick}>{title}</div>
    );
  };

  const renderUserAction = (isCollaborative, tooltip) => {
    return (
      <Tooltip title={tooltip}>
        <div className="RoomCard-helpAction">
          {isCollaborative ? <TeamOutlined /> : <UserOutlined />}
        </div>
      </Tooltip>
    );
  };

  const renderInfoAction = tooltip => {
    return (
      <Tooltip title={tooltip}>
        <div className="RoomCard-helpAction"><InfoCircleOutlined /></div>
      </Tooltip>
    );
  };

  const actions = [];

  if (userAccessibleRoom || isDeletedRoom) {
    actions.push((
      <div key="favorite">
        <FavoriteStar
          id={roomId}
          type={FAVORITE_TYPE.room}
          onToggle={isFavorite => onToggleFavorite(roomId, isFavorite)}
          />
      </div>
    ));
  }

  if (userAccessibleRoom) {
    const userAsMember = userAccessibleRoom.members?.find(member => member.userId === user?._id);
    const membersCount = userAccessibleRoom.members?.length || 0;

    actions.push(renderUserAction(
      userAccessibleRoom.isCollaborative,
      (
        <div className="RoomCard-infoTooltip">
          {!!userAccessibleRoom.isCollaborative && <div>{t('collaborativeRoom')}</div>}
          <div>{t('createdByUser', { user: userAccessibleRoom.owner?.displayName })}</div>
          <div>{!userAccessibleRoom.isCollaborative && t('hasCountMembers', { count: membersCount })}</div>
          <div>{!!userAccessibleRoom.isCollaborative && t('hasCountCollaborators', { count: membersCount })}</div>
        </div>
      )
    ));

    actions.push(renderInfoAction((
      <div className="RoomCard-infoTooltip">
        {!!favoriteRoom && (
          <div>{t('common:favoritedByTooltip', { count: favoriteRoom.favoritedByCount })}</div>
        )}
        <div>{t('createdOnDate', { date: formatDate(userAccessibleRoom.createdOn) })}</div>
        <div>{t('updatedOnDate', { date: formatDate(userAccessibleRoom.updatedOn) })}</div>
        {!!userAsMember && (
          <div>{t('common:joinedOnDate', { date: formatDate(userAsMember.joinedOn) })}</div>
        )}
      </div>
    )));
  }

  if (roomInvitation) {
    actions.push(renderUserAction(
      roomInvitation.room?.isCollaborative,
      (
        <div className="RoomCard-infoTooltip">
          {!!roomInvitation.room?.isCollaborative && <div>{t('collaborativeRoom')}.</div>}
          <div>{t('createdByUser', { user: roomInvitation.room?.owner?.displayName })}</div>
        </div>
      )
    ));

    actions.push(renderInfoAction((
      <div className="RoomCard-infoTooltip">
        <div>{t('common:invitedOnDate', { date: formatDate(roomInvitation.sentOn) })}</div>
        <div><Markdown>{t('invitationValidUntilDate', { date: formatDate(roomInvitation.expiresOn) })}</Markdown></div>
      </div>
    )));

    actions.push((
      <Tooltip title={t('acceptRoomInvitation')}>
        <div onClick={handleAcceptInvitationClick}>
          <MailOutlined />
        </div>
      </Tooltip>
    ));
  }

  const contentClasses = classNames(
    'RoomCard-content',
    { 'RoomCard-content--deletedRoom': isDeletedRoom },
    { 'RoomCard-content--disabledNavigation': !userAccessibleRoom }
  );

  return (
    <Card className="RoomCard" actions={actions} title={renderTitle()}>
      <div className={contentClasses} onClick={handleCardClick}>
        <div className="RoomCard-details">
          <div className="RoomCard-description">
            {userAccessibleRoom?.shortDescription || roomInvitation?.room?.shortDescription}
          </div>
        </div>
      </div>
    </Card>
  );
}

RoomCard.propTypes = {
  room: roomShape,
  favoriteRoom: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    setOn: PropTypes.string.isRequired,
    favoritedByCount: PropTypes.number,
    data: favoriteRoomShape
  }),
  roomInvitation: roomInvitationBasicShape,
  onToggleFavorite: PropTypes.func
};

RoomCard.defaultProps = {
  room: null,
  favoriteRoom: null,
  roomInvitation: null,
  onToggleFavorite: () => {}
};

export default RoomCard;
