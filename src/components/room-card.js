import React from 'react';
import PropTypes from 'prop-types';
import Markdown from './markdown.js';
import { Button, Divider } from 'antd';
import routes from '../utils/routes.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { ROOM_ACCESS } from '../domain/constants.js';
import PublicIcon from './icons/general/public-icon.js';
import PrivateIcon from './icons/general/private-icon.js';
import RoomJoinedIcon from './icons/user-activities/room-joined-icon.js';
import { invitationBasicShape, roomMemberShape, roomMetadataProps } from '../ui/default-prop-types.js';

function RoomCard({ room, invitation }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomCard');

  const userAsMember = room.members?.find(member => member.userId === user?._id);

  const renderOwner = () => {
    return (
      <span className="RoomCard-owner">
        {`${t('common:owner')}: `}
        <a href={routes.getUserUrl(room.owner._id)}>{room.owner.displayName}</a>
      </span>
    );
  };

  const renderAccess = () => {
    return (
      <div className="RoomCard-accessCell">
        {room.access === ROOM_ACCESS.private && <PrivateIcon />}
        {room.access === ROOM_ACCESS.public && <PublicIcon />}
        <span>{t(`common:accessType_${room.access}`)}</span>
      </div>
    );
  };

  const handleButtonClick = () => {
    window.location = routes.getRoomUrl(room._id, room.slug);
  };

  return (
    <div className="RoomCard">
      <div className="RoomCard-name">{room.name}</div>
      {!!(userAsMember || invitation) && renderOwner()}
      <Divider />
      <div className="RoomCard-infoRow">
        <span className="RoomCard-infoLabel">{t('common:access')}:</span>
        <div>{renderAccess()}</div>
      </div>
      <div className="RoomCard-infoRow">
        <span className="RoomCard-infoLabel">{t('documentsMode')}:</span>
        <div>{t(`common:documentsMode_${room.documentsMode}`)}</div>
      </div>
      {!!room.createdOn && (
        <div className="RoomCard-infoRow">
          <span className="RoomCard-infoLabel">{t('common:created')}:</span>
          <div>{formatDate(room.createdOn)}</div>
        </div>
      )}
      {!!room.updatedOn && (
        <div className="RoomCard-infoRow">
          <span className="RoomCard-infoLabel">{t('common:updated')}:</span>
          <div>{formatDate(room.updatedOn)}</div>
        </div>
      )}
      {!userAsMember && !!room.members && (
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
      {!!invitation?.sentOn && (
        <div className="RoomCard-infoRow">
          <span className="RoomCard-infoLabel">{t('invited')}:</span>
          <div>{formatDate(invitation.sentOn)}</div>
        </div>
      )}
      {!!invitation?.expires && (
        <div className="RoomCard-infoRow RoomCard-infoRow--textBlock">
          <Markdown>{t('acceptInvitation', { date: formatDate(invitation.expires) })}</Markdown>
        </div>
      )}
      <Button className="RoomCard-button" type="primary" onClick={handleButtonClick}><RoomJoinedIcon />{t('button')}</Button>
      {!!invitation && <div className="RoomCard-disablingOverlay" />}
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

RoomCard.propTypes = {
  invitation: invitationBasicShape,
  room: PropTypes.shape(roomProps).isRequired
};

RoomCard.defaultProps = {
  invitation: null
};

export default RoomCard;
