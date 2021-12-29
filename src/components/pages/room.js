import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../language-context.js';
import { Row, Space, List, Collapse, Button } from 'antd';
import { invitationShape, roomShape } from '../../ui/default-prop-types.js';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';

export default function Room({ PageTemplate, initialState }) {
  const { t } = useTranslation('room');
  const { formatDate } = useDateFormat();
  const { roomDetails, invitations } = initialState;
  const [isRoomInvitationModalOpen, setIsRoomInvitationModalOpen] = useState(false);

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

  const displayInvitations = () => (
    <Collapse className="Room-invitationsCollapse">
      <Collapse.Panel header={t('invitationsHeader', { count: invitations.length })} extra={<Button onClick={handleOpenInvitationModalClick}>{t('createInvitationButton')}</Button>}>
        <List
          dataSource={invitations}
          renderItem={invitation => (
            <List.Item>
              <Space>
                <Space>
                  <span>{t('common:email')}:</span>
                  <span>{invitation.email}</span>
                </Space>

                <Space>
                  <span>{t('sentOn')}:</span>
                  <span>{formatDate(invitation.sentOn)}</span>
                </Space>

                <Space>
                  <span>{t('expires')}:</span>
                  <span>{formatDate(invitation.expires)}</span>
                </Space>
              </Space>
            </List.Item>)}
          />
      </Collapse.Panel>
    </Collapse>
  );

  return (
    <PageTemplate>
      <h1> {t('pageNames:room', { roomName: roomDetails.name })}</h1>
      <Row>
        <Space>
          <span>{t('ownerUsername')}:</span>
          <span> {roomDetails.owner.username}</span>
        </Space>
      </Row>
      <Collapse className="Room-membersCollapse">
        <Collapse.Panel header={t('roomMembersHeader', { count: roomDetails.members.length })} >
          <List
            dataSource={roomDetails.members}
            renderItem={member => (
              <List.Item>
                <Space>
                  <Space>
                    <span>{t('memberUsername')}:</span>
                    <span>{member.username}</span>
                  </Space>

                  <Space>
                    <span>{t('joinedOn')}:</span>
                    <span>{formatDate(member.joinedOn)}</span>
                  </Space>
                </Space>
              </List.Item>)}
            />
        </Collapse.Panel>
      </Collapse>
      { invitations && displayInvitations(invitations) }
      <RoomInvitationCreationModal isVisible={isRoomInvitationModalOpen} onClose={handleInvitationModalClose} roomId={roomDetails._id} />
    </PageTemplate>);
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    roomDetails: roomShape,
    invitations: PropTypes.arrayOf(invitationShape)
  }).isRequired
};
