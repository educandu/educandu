import React from 'react';
import PropTypes from 'prop-types';
import { Button, Divider } from 'antd';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { roomMemberShape, roomMetadataProps } from '../ui/default-prop-types.js';
import RoomJoinedIcon from '../components/icons/user-activities/room-joined-icon.js';

function RoomPublicCard({ room }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomPublicCard');

  const handleButtonClick = () => {
    window.location = routes.getRoomUrl(room._id, room.slug);
  };

  return (
    <div className="RoomPublicCard">
      <div className="RoomPublicCard-title">{room.name}</div>
      <Divider className="RoomPublicCard-divider" />
      <div className="RoomPublicCard-infoRow">
        <span>{t('documentsMode')}:</span>
        <div>{t(`common:documentsMode_${room.documentsMode}`)}</div>
      </div>
      <div className="RoomPublicCard-infoRow">
        <span>{t('common:created')}:</span>
        <div className="RoomPublicCard-date">{formatDate(room.createdOn)}</div>
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

RoomPublicCard.propTypes = {
  room: PropTypes.shape(roomProps).isRequired
};

export default RoomPublicCard;
