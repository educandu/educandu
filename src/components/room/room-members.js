import by from 'thenby';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import UserCard from '../user-card.js';
import EmptyState from '../empty-state.js';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useEffect, useState } from 'react';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { MailOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';
import { roomInvitationShape, roomMemberShape } from '../../ui/default-prop-types.js';
import { confirmRoomMemberDelete, confirmRoomInvitationDelete } from '../confirmation-dialogs.js';

export default function RoomMembers({
  roomId,
  roomIsCollaborative,
  initialRoomMembers,
  initialRoomInvitations,
  onChange
}) {
  const { t } = useTranslation('roomMembers');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [members, setMembers] = useState(initialRoomMembers);
  const [invitations, setInvitations] = useState(initialRoomInvitations.sort(by(x => x.sentOn)));

  const [isRoomInvitationModalOpen, setIsRoomInvitationModalOpen] = useState(false);

  useEffect(() => {
    onChange({ membersCount: members.length, invitationsCount: invitations.length });
  }, [onChange, members, invitations]);

  const handleCreateInvitationButtonClick = event => {
    setIsRoomInvitationModalOpen(true);
    event.stopPropagation();
  };

  const handleInvitationModalClose = newInvitations => {
    setIsRoomInvitationModalOpen(false);
    if (newInvitations) {
      setInvitations(currentInvitations => {
        const invitationsByEmail = new Map(currentInvitations.map(x => [x.email, x]));
        newInvitations.forEach(newInvitation => invitationsByEmail.set(newInvitation.email, newInvitation));
        return [...invitationsByEmail.values()].sort(by(x => x.sentOn));
      });
    }
  };

  const handleDeleteRoomMemberClick = member => {
    confirmRoomMemberDelete(t, member.displayName, async () => {
      const response = await roomApiClient.deleteRoomMember({ roomId, memberUserId: member.userId });
      const newMembers = response.room.members;

      setMembers(newMembers);
    });
  };

  const handleRemoveRoomInvitationClick = invitation => {
    confirmRoomInvitationDelete(t, invitation.email, async () => {
      const response = await roomApiClient.deleteRoomInvitation({ invitationId: invitation._id });
      const newInvitations = response.invitations.sort(by(x => x.sentOn));

      setInvitations(newInvitations);
    });
  };

  const renderMember = member => {
    return (
      <div key={member.userId}>
        <UserCard
          roomMember={member}
          onDeleteRoomMember={() => handleDeleteRoomMemberClick(member)}
          />
      </div>
    );
  };

  const renderInvitation = invitation => {
    return (
      <div key={invitation._id}>
        <UserCard
          roomInvitation={invitation}
          onDeleteRoomInvitation={() => handleRemoveRoomInvitationClick(invitation)}
          />
      </div>
    );
  };

  const roomMembersIcon = roomIsCollaborative ? <TeamOutlined /> : <UserOutlined />;
  const inviteMemberButtonText = roomIsCollaborative ? t('inviteCollaboratorsButton') : t('inviteMembersButton');
  const emptyStateTitle = roomIsCollaborative ? t('collaboratorsEmptyStateTitle') : t('membersEmptyStateTitle');

  const showEmptyState = !members.length && !invitations.length;

  return (
    <div className="RoomMembers">
      {!!showEmptyState && (
        <EmptyState
          icon={roomMembersIcon}
          title={emptyStateTitle}
          subtitle={t('membersEmptyStateSubtitle')}
          button={{
            text: inviteMemberButtonText,
            icon: <MailOutlined />,
            onClick: handleCreateInvitationButtonClick
          }}
          />
      )}
      {!showEmptyState && (
        <Fragment>
          <Button
            type="primary"
            icon={<MailOutlined />}
            className="RoomMembers-inviteMemberButton"
            onClick={handleCreateInvitationButtonClick}
            >
            {inviteMemberButtonText}
          </Button>
          <div className="RoomMembers-members">
            {members.map(renderMember)}
            {invitations.map(renderInvitation)}
          </div>
        </Fragment>
      )}

      <RoomInvitationCreationModal
        roomId={roomId}
        isOpen={isRoomInvitationModalOpen}
        onOk={handleInvitationModalClose}
        onCancel={handleInvitationModalClose}
        />
    </div>
  );
}

RoomMembers.propTypes = {
  roomId: PropTypes.string.isRequired,
  roomIsCollaborative: PropTypes.bool.isRequired,
  initialRoomMembers: PropTypes.arrayOf(roomMemberShape).isRequired,
  initialRoomInvitations: PropTypes.arrayOf(roomInvitationShape).isRequired,
  onChange: PropTypes.func.isRequired
};
