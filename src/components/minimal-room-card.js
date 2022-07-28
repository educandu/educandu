import React from 'react';
import PropTypes from 'prop-types';
import { Button, Divider } from 'antd';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { roomMemberShape, roomMetadataProps } from '../ui/default-prop-types.js';
import RoomJoinedIcon from './icons/user-activities/room-joined-icon.js';

function MinimalRoomCard({ room }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('minimalRoomCard');

  const handleButtonClick = () => {
    window.location = routes.getRoomUrl(room._id, room.slug);
  };

  return (
    <div className="MinimalRoomCard">
      <div className="MinimalRoomCard-title">{room.name}</div>
      <Divider className="MinimalRoomCard-divider" />
      <div className="MinimalRoomCard-infoRow">
        <span>{t('documentsMode')}:</span>
        <div>{t(`common:documentsMode_${room.documentsMode}`)}</div>
      </div>
      <div className="MinimalRoomCard-infoRow">
        <span>{t('common:created')}:</span>
        <div className="MinimalRoomCard-date">{formatDate(room.createdOn)}</div>
      </div>
      <Button className="RoomCard-button" type="primary" onClick={handleButtonClick}><RoomJoinedIcon />{t('button')}</Button>
    </div>
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

MinimalRoomCard.propTypes = {
  room: PropTypes.shape(roomProps).isRequired
};

export default MinimalRoomCard;
