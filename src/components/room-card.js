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
import { roomInvitationBasicShape, roomMemberShape, roomMetadataProps } from '../ui/default-prop-types.js';

function RoomCard({ room, roomInvitation, favoritedByCount, onToggleFavorite }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomCard');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const isDeletedRoom = !room;
  const canNavigateToRoom = !isDeletedRoom && !roomInvitation;
  const userAsMember = room?.members?.find(member => member.userId === user?._id);

  const handleCardClick = () => {
    if (canNavigateToRoom) {
      window.location = routes.getRoomUrl(room._id, room.slug);
    }
  };

  const handleJoinButtonClick = async () => {
    await roomApiClient.confirmInvitation({ token: roomInvitation.token });
    window.location = routes.getRoomUrl(roomInvitation.room._id);
  };

  const renderTitle = () => {
    const title = isDeletedRoom ? `[${t('common:deletedRoom')}]` : room.name;

    return (
      <div
        className={classNames('RoomCard-title', { 'RoomCard-title--nonClickable': !canNavigateToRoom })}
        onClick={handleCardClick}
        >
        {title}
      </div>
    );
  };

  const renderUserAction = tooltip => {
    return (
      <Tooltip title={tooltip}>
        {room?.isCollaborative ? <TeamOutlined /> : <UserOutlined />}
      </Tooltip>
    );
  };

  const renderInfoAction = tooltip => {
    return (
      <Tooltip title={tooltip}>
        <InfoCircleOutlined />
      </Tooltip>
    );
  };

  const actions = [];

  if (room && !roomInvitation) {
    actions.push((
      <div key="favorite" className="UserCard-favoriteAction">
        <FavoriteStar
          id={room._id}
          type={FAVORITE_TYPE.room}
          onToggle={isFavorite => onToggleFavorite(room._id, isFavorite)}
          />
      </div>
    ));

    actions.push(renderUserAction((
      <div className="RoomCard-infoTooltip">
        {!!room.isCollaborative && <div>{t('collaborativeRoom')}</div>}
        <div>{t('common:by')}: {room.owner?.displayName}</div>
        <div>{room?.isCollaborative ? t('common:collaborators') : t('common:members')}: {room.members.length}</div>
      </div>
    )));

    actions.push(renderInfoAction((
      <div className="RoomCard-infoTooltip">
        {Number.isInteger(favoritedByCount) && (
          <div>{t('common:favoritedByTooltip', { count: favoritedByCount })}</div>
        )}
        <div>{t('common:created')}: {formatDate(room.createdOn)}</div>
        <div>{t('common:updated')}: {formatDate(room.updatedOn)}</div>
        {userAsMember ? <div>{t('joined')}: {formatDate(userAsMember.joinedOn)}</div> : null}
      </div>
    )));
  }

  if (roomInvitation) {
    actions.push(renderUserAction((
      <div className="RoomCard-infoTooltip">
        {!!room.isCollaborative && <div>{t('collaborativeRoom')}</div>}
        <div>{t('common:by')}: {room.owner?.displayName}</div>
      </div>
    )));

    actions.push(renderInfoAction((
      <div className="RoomCard-infoTooltip">
        <div>{t('invited')}: {formatDate(roomInvitation.sentOn)}</div>
        <div><Markdown>{t('acceptInvitation', { date: formatDate(roomInvitation.expiresOn) })}</Markdown></div>
      </div>
    )));

    actions.push((
      <Tooltip title={t('acceptRoomInvitation')}>
        <div onClick={handleJoinButtonClick}>
          <MailOutlined />
        </div>
      </Tooltip>
    ));
  }

  return (
    <Card className="RoomCard" actions={actions} title={renderTitle()}>
      <div className={classNames('RoomCard-content', { 'RoomCard-content--nonClickable': !canNavigateToRoom })} onClick={handleCardClick}>
        <div className="RoomCard-details">
          <div className="RoomCard-description">{room?.shortDescription}</div>
        </div>
      </div>
    </Card>
  );
}

const roomProps = {
  ...roomMetadataProps,
  _id: PropTypes.string,
  updatedOn: PropTypes.string,
  owner: PropTypes.shape({
    email: PropTypes.string,
    displayName: PropTypes.string.isRequired
  }),
  members: PropTypes.arrayOf(roomMemberShape)
};

RoomCard.propTypes = {
  room: PropTypes.shape(roomProps),
  roomInvitation: roomInvitationBasicShape,
  favoritedByCount: PropTypes.number,
  onToggleFavorite: PropTypes.func
};

RoomCard.defaultProps = {
  room: null,
  roomInvitation: null,
  favoritedByCount: null,
  onToggleFavorite: () => {}
};

export default RoomCard;
