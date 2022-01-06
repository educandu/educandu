import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../language-context.js';
import { Space, List, Collapse, Button, Tabs } from 'antd';
import { ROOM_ACCESS_LEVEL } from '../../domain/constants.js';
import { invitationShape, roomShape } from '../../ui/default-prop-types.js';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';

const { TabPane } = Tabs;

export default function Room({ PageTemplate, initialState }) {
  const user = useUser();
  const { t } = useTranslation('room');
  const { formatDate } = useDateFormat();
  const [isRoomInvitationModalOpen, setIsRoomInvitationModalOpen] = useState(false);

  const { room, invitations } = initialState;
  const isRoomOwner = user._id === room.owner.key;
  const isPrivateRoom = room.access === ROOM_ACCESS_LEVEL.private;

  const handleOpenInvitationModalClick = event => {
    setIsRoomInvitationModalOpen(true);
    event.stopPropagation();
  };

  const handleInvitationModalClose = wasNewInvitationCreated => {
    setIsRoomInvitationModalOpen(false);

    if (!wasNewInvitationCreated) {
      return;
    }
    window.location.reload();
  };

  const renderRoomMembers = () => (
    <Collapse className="Room-sectionCollapse">
      <Collapse.Panel header={t('roomMembersHeader', { count: room.members.length })} >
        <List
          dataSource={room.members}
          renderItem={member => (
            <List.Item className="Room-sectionCollapseRow">
              <Space>
                <span>{formatDate(member.joinedOn)}</span>
                <span>{member.username}</span>
              </Space>
            </List.Item>)}
          />
      </Collapse.Panel>
    </Collapse>
  );

  const renderRoomInvitations = () => (
    <Collapse className="Room-sectionCollapse">
      <Collapse.Panel
        header={t('invitationsHeader', { count: invitations.length })}
        extra={<Button onClick={handleOpenInvitationModalClick}>{t('createInvitationButton')}</Button>}
        >
        <List
          dataSource={invitations}
          renderItem={invitation => (
            <List.Item className="Room-sectionCollapseRow">
              <Space>
                <span>{formatDate(invitation.sentOn)}</span>
                <span>{invitation.email}</span>
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
    <PageTemplate>
      <div className="Room">
        <h1> {t('pageNames:room', { roomName: room.name })}</h1>
        <Tabs className="Tabs" defaultActiveKey="1" type="line" size="large">
          <TabPane className="Tabs-tabPane" tab={t('lessonsTabTitle')} key="1" />

          <TabPane className="Tabs-tabPane" tab={t('membersTabTitle')} key="2">
            <span>{t('roomOwner')}: {room.owner.username}</span>
            {isPrivateRoom && renderRoomMembers()}
            {isPrivateRoom && isRoomOwner && renderRoomInvitations()}
            <RoomInvitationCreationModal isVisible={isRoomInvitationModalOpen} onClose={handleInvitationModalClose} roomId={room._id} />
          </TabPane>

          {isRoomOwner && (<TabPane className="Tabs-tabPane" tab={t('settingsTabTitle')} key="3" />)}
        </Tabs>
      </div>
    </PageTemplate>);
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    room: roomShape.isRequired,
    invitations: PropTypes.arrayOf(invitationShape).isRequired
  }).isRequired
};
