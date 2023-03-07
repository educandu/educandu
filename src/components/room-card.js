import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { Button, Divider } from 'antd';
import routes from '../utils/routes.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { MailOutlined } from '@ant-design/icons';
import { useDateFormat } from './locale-context.js';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import RoomJoinedIcon from './icons/user-activities/room-joined-icon.js';
import { invitationBasicShape, roomMemberShape, roomMetadataProps } from '../ui/default-prop-types.js';

function RoomCard({ room, invitation, alwaysRenderOwner }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomCard');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const isDeletedRoom = !room;
  const userAsMember = room?.members?.find(member => member.userId === user?._id);
  const showOwner = !!(userAsMember || invitation || alwaysRenderOwner);

  const renderOwner = () => {
    return (
      <span className="RoomCard-owner">
        {`${t('common:owner')}: `}
        <a href={routes.getUserProfileUrl(room.owner?._id)}>{room.owner?.displayName}</a>
      </span>
    );
  };

  const handleEnterButtonClick = () => {
    window.location = routes.getRoomUrl(room._id, room.slug);
  };

  const handleJoinButtonClick = async () => {
    await roomApiClient.confirmInvitation({ token: invitation.token });
    window.location = routes.getRoomUrl(invitation.room._id);
  };

  const roomName = isDeletedRoom ? `[${t('common:deletedRoom')}]` : room.name;

  return (
    <div className="RoomCard">
      <div className="RoomCard-content">
        <div className="RoomCard-header">
          <div className={classNames('RoomCard-name', { 'RoomCard-name--doubleLine': !showOwner })}>{roomName}</div>
          {!!showOwner && !isDeletedRoom && renderOwner()}
        </div>
        <Divider className="RoomCard-divider" />
        {!!room?.documentsMode && (
          <div className="RoomCard-infoRow">
            <span className="RoomCard-infoLabel">{t('documentsMode')}:</span>
            <div>{t(`common:documentsMode_${room.documentsMode}`)}</div>
          </div>
        )}
        {!!room?.updatedOn && (
          <div className="RoomCard-infoRow">
            <span className="RoomCard-infoLabel">{t('updated')}:</span>
            <div>{formatDate(room.updatedOn)}</div>
          </div>
        )}
        {!userAsMember && !!room?.members && (
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
      </div>
      {!!invitation?.expiresOn && (
        <div className="RoomCard-infoRow RoomCard-infoRow--textBlock">
          <Markdown>{t('acceptInvitation', { date: formatDate(invitation.expiresOn) })}</Markdown>
        </div>
      )}
      {!invitation && (
        <Button className="RoomCard-button" type="primary" disabled={!!isDeletedRoom} onClick={handleEnterButtonClick}>
          <RoomJoinedIcon />
          {t('common:enterRoom')}
        </Button>
      )}
      {!!invitation && (
        <Button className="RoomCard-button" onClick={handleJoinButtonClick}>
          <MailOutlined />
          {t('joinButton')}
        </Button>
      )}
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
  alwaysRenderOwner: PropTypes.bool,
  invitation: invitationBasicShape,
  room: PropTypes.shape(roomProps)
};

RoomCard.defaultProps = {
  alwaysRenderOwner: false,
  invitation: null,
  room: null
};

export default RoomCard;
