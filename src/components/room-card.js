import React from 'react';
import { Button, Divider } from 'antd';
import routes from '../utils/routes.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import PublicIcon from './icons/general/public-icon.js';
import { roomShape } from '../ui/default-prop-types.js';
import PrivateIcon from './icons/general/private-icon.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';

const MAX_NAME_LENGTH = 70;

function RoomCard({ room }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomCard');

  const userAsMember = room.members.find(member => member.userId === user._id);

  const renderName = () => {
    return room.name.length > MAX_NAME_LENGTH ? `${room.name.substring(0, MAX_NAME_LENGTH)}...` : room.name;
  };

  const renderOwner = () => {
    return (
      <span className="RoomCard-owner">
        {`${t('common:owner')}: `}
        {!!room.owner.email && <a href={`mailto:${room.owner.email}`}>{room.owner.username}</a>}
        {!room.owner.email && room.owner.username}
      </span>
    );
  };

  const renderAccess = () => {
    return (
      <div className="RoomCard-accessCell">
        {room.access === ROOM_ACCESS_LEVEL.private && <PrivateIcon />}
        {room.access === ROOM_ACCESS_LEVEL.public && <PublicIcon />}
        <span>{t(`common:accessType_${room.access}`)}</span>
      </div>
    );
  };

  const handleButtonClick = () => {
    window.location = routes.getRoomUrl(room._id, room.slug);
  };

  return (
    <div className="RoomCard">
      <div className="RoomCard-name">{renderName()}</div>
      {!!userAsMember && renderOwner()}
      <Divider />
      <div className="RoomCard-infoRow">
        <span className="RoomCard-infoLabel">{t('common:access')}:</span>
        <div>{renderAccess()}</div>
      </div>
      <div className="RoomCard-infoRow">
        <span className="RoomCard-infoLabel">{t('lessonsMode')}:</span>
        <div>{t(`common:lessonsMode_${room.lessonsMode}`)}</div>
      </div>
      <div className="RoomCard-infoRow">
        <span className="RoomCard-infoLabel">{t('common:created')}:</span>
        <div>{formatDate(room.createdOn)}</div>
      </div>
      <div className="RoomCard-infoRow">
        <span className="RoomCard-infoLabel">{t('updated')}:</span>
        <div>{formatDate(room.updatedOn)}</div>
      </div>
      {!userAsMember && (
        <div className="RoomCard-infoRow">
          <span className="RoomCard-infoLabel">{t('members')}:</span>
          <div>{room.members.length}</div>
        </div>
      )}
      {!!userAsMember && (
        <div className="RoomCard-infoRow">
          <span className="RoomCard-infoLabel">{t('joined')}:</span>
          <div>{formatDate(userAsMember.joinedOn)}</div>
        </div>
      )}
      <Button className="RoomCard-button" type="primary" onClick={handleButtonClick}>{t('button')}</Button>
    </div>
  );
}

RoomCard.propTypes = {
  room: roomShape.isRequired
};

export default RoomCard;
