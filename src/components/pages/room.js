import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined } from '@ant-design/icons';
import { useService } from '../container-context.js';
import { useDateFormat } from '../language-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import { Row, Space, List, Collapse, Button } from 'antd';
import { ROOM_ACCESS_LEVEL } from '../../domain/constants.js';
import { confirmRoomDelete } from '../confirmation-dialogs.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { invitationShape, roomShape } from '../../ui/default-prop-types.js';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';

const logger = new Logger(import.meta.url);

export default function Room({ PageTemplate, initialState }) {
  const { t } = useTranslation('room');
  const { formatDate } = useDateFormat();
  const { room, invitations } = initialState;
  const [isRoomInvitationModalOpen, setIsRoomInvitationModalOpen] = useState(false);
  const user = useUser();
  const roomApiClient = useService(RoomApiClient);
  const isRoomOwner = user._id === room.owner.key;

  const handleOpenInvitationModalClick = event => {
    setIsRoomInvitationModalOpen(true);
    event.stopPropagation();
  };

  const handleRoomDelete = async () => {
    try {
      await roomApiClient.deleteRoom(room._id);
      window.location = urls.getMySpaceUrl();
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleRoomDeleteClick = () => {
    confirmRoomDelete(t, room.name, handleRoomDelete);
  };

  const handleInvitationModalClose = wasNewInvitationCreated => {
    setIsRoomInvitationModalOpen(false);

    if (!wasNewInvitationCreated) {
      return;
    }
    window.location.reload();
  };

  const isPrivateRoom = room.access === ROOM_ACCESS_LEVEL.private;
  const shouldDisplayInvitations = isPrivateRoom && isRoomOwner;
  const headerActions = [];
  if (isRoomOwner) {
    headerActions.push({
      key: 'delete',
      type: 'primary',
      icon: DeleteOutlined,
      text: t('deleteRoomButton'),
      handleClick: handleRoomDeleteClick
    });
  }

  const displayMembers = (
    <Collapse className="Room-sectionCollapse">
      <Collapse.Panel header={t('roomMembersHeader', { count: room.members.length })} >
        <List
          dataSource={room.members}
          renderItem={member => (
            <List.Item>
              <Space>
                <Space>
                  <span>{formatDate(member.joinedOn)}</span>
                </Space>

                <Space>
                  <span>{member.username}</span>
                </Space>
              </Space>
            </List.Item>)}
          />
      </Collapse.Panel>
    </Collapse>
  );

  const displayInvitations = (
    <Collapse className="Room-sectionCollapse">
      <Collapse.Panel
        header={t('invitationsHeader', { count: invitations.length })}
        extra={<Button onClick={handleOpenInvitationModalClick}>{t('createInvitationButton')}</Button>}
        >
        <List
          dataSource={invitations}
          renderItem={invitation => (
            <List.Item className="Room-invitationRow">
              <Space>
                <span>{formatDate(invitation.sentOn)}</span>
                <Space>
                  <span>{invitation.email}</span>
                </Space>
              </Space>

              <Space>
                <span>{t('expires')}:</span>
                <span>{formatDate(invitation.expires)}</span>
              </Space>

            </List.Item>
          )}
          />
      </Collapse.Panel>
    </Collapse>
  );

  return (
    <PageTemplate headerActions={headerActions}>
      <h1> {t('pageNames:room', { roomName: room.name })}</h1>
      <Row>
        <Space>
          <span>{t('ownerUsername')}:</span>
          <span> {room.owner.username}</span>
        </Space>
      </Row>
      { isPrivateRoom && displayMembers }
      { shouldDisplayInvitations && displayInvitations }
      <RoomInvitationCreationModal isVisible={isRoomInvitationModalOpen} onClose={handleInvitationModalClose} roomId={room._id} />
    </PageTemplate>);
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    room: roomShape.isRequired,
    invitations: PropTypes.arrayOf(invitationShape).isRequired
  }).isRequired
};
