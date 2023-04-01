import by from 'thenby';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import UserCard from '../user-card.js';
import EmptyState from '../empty-state.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import FavoriteStar from '../favorite-star.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import MessageBoard from '../room/message-board.js';
import RoomIcon from '../icons/general/room-icon.js';
import RoomDocuments from '../room/room-documents.js';
import WriteIcon from '../icons/general/write-icon.js';
import RoomMetadataForm from '../room-metadata-form.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import SettingsIcon from '../icons/main-menu/settings-icon.js';
import { Button, Tabs, message, Breadcrumb, Form } from 'antd';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { RoomMediaContextProvider } from '../room-media-context.js';
import RoomExitedIcon from '../icons/user-activities/room-exited-icon.js';
import IrreversibleActionsSection from '../irreversible-actions-section.js';
import { MailOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';
import { isRoomInvitedCollaborator, isRoomOwner } from '../../utils/room-utils.js';
import { roomShape, invitationShape, documentExtendedMetadataShape, roomMediaContextShape } from '../../ui/default-prop-types.js';
import { confirmRoomDelete, confirmRoomMemberDelete, confirmRoomInvitationDelete, confirmLeaveRoom } from '../confirmation-dialogs.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

const VIEW_MODE = {
  owner: 'owner',
  collaboratingMember: 'collaborating-member',
  nonCollaboratingMember: 'non-collaborating-member'
};

export default function Room({ PageTemplate, initialState }) {
  const user = useUser();
  const contentFormRef = useRef(null);
  const metadataFormRef = useRef(null);
  const { t } = useTranslation('room');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [room, setRoom] = useState(initialState.room);
  const [isRoomInvitationModalOpen, setIsRoomInvitationModalOpen] = useState(false);
  const [invitations, setInvitations] = useState(initialState.invitations.sort(by(x => x.sentOn)));
  const [isRoomContentUpdateButtonDisabled, setIsRoomContentUpdateButtonDisabled] = useState(true);
  const [isRoomMetadataUpdateButtonDisabled, setIsRoomMetadataUpdateButtonDisabled] = useState(true);

  const viewMode = useMemo(() => {
    if (isRoomOwner({ room, userId: user?._id })) {
      return VIEW_MODE.owner;
    }
    if (isRoomInvitedCollaborator({ room, userId: user?._id })) {
      return VIEW_MODE.collaboratingMember;
    }
    return VIEW_MODE.nonCollaboratingMember;
  }, [room, user]);

  useEffect(() => {
    history.replaceState(null, '', routes.getRoomUrl(room._id, room.slug));
  }, [room._id, room.slug]);

  const handleCreateInvitationButtonClick = event => {
    setIsRoomInvitationModalOpen(true);
    event.stopPropagation();
  };

  const handleRoomDelete = async () => {
    try {
      await roomApiClient.deleteRoom({ roomId: room._id });
      window.location = routes.getDashboardUrl();
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await roomApiClient.deleteRoomMember({ roomId: room._id, memberUserId: user._id });
      window.location = routes.getDashboardUrl({ tab: 'rooms' });
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleDeleteRoomClick = () => {
    confirmRoomDelete(t, room.name, handleRoomDelete);
  };

  const handleLeaveRoomClick = () => {
    confirmLeaveRoom(t, room.name, handleLeaveRoom);
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

  const handleUpdateRoomContentClick = () => {
    if (contentFormRef.current) {
      contentFormRef.current.submit();
    }
  };

  const handleRoomContentFormFieldsChanged = () => {
    setIsRoomContentUpdateButtonDisabled(false);
  };

  const handleRoomContentFormSubmitted = async ({ overview }) => {
    try {
      const response = await roomApiClient.updateRoomContent({ roomId: room._id, overview });

      setRoom(response.room);
      setIsRoomContentUpdateButtonDisabled(true);
      message.success(t('common:changesSavedSuccessfully'));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleUpdateRoomMetadataClick = () => {
    if (metadataFormRef.current) {
      metadataFormRef.current.submit();
    }
  };

  const handleRoomMetadataFormSubmitted = async ({ name, slug, isCollaborative, shortDescription }) => {
    try {
      const response = await roomApiClient.updateRoomMetadata({ roomId: room._id, name, slug, isCollaborative, shortDescription });

      setRoom(response.room);
      setIsRoomMetadataUpdateButtonDisabled(true);
      message.success(t('common:changesSavedSuccessfully'));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleRoomMetadataFormFieldsChanged = () => {
    setIsRoomMetadataUpdateButtonDisabled(false);
  };

  const handleDeleteRoomMemberClick = member => {
    confirmRoomMemberDelete(t, member.displayName, async () => {
      const response = await roomApiClient.deleteRoomMember({ roomId: room._id, memberUserId: member.userId });
      setRoom(response.room);
    });
  };

  const handleRemoveRoomInvitationClick = invitation => {
    confirmRoomInvitationDelete(t, invitation.email, async () => {
      const response = await roomApiClient.deleteRoomInvitation({ invitationId: invitation._id });
      setInvitations(response.invitations.sort(by(x => x.sentOn)));
    });
  };

  const renderRoomOverview = () => {
    return <Markdown className="RoomPage-overview">{room.overview}</Markdown>;
  };

  const renderRoomMember = member => {
    return (
      <div key={member.userId}>
        <UserCard
          roomMember={member}
          onDeleteRoomMember={() => handleDeleteRoomMemberClick(member)}
          />
      </div>
    );
  };

  const renderRoomInvitation = invitation => {
    return (
      <div className="RoomPage-member" key={invitation._id}>
        <UserCard
          roomInvitation={invitation}
          onDeleteRoomInvitation={() => handleRemoveRoomInvitationClick(invitation)}
          />
      </div>
    );
  };

  const membersTabCount = invitations.length
    ? `${room.members.length}/${room.members.length + invitations.length}`
    : room.members.length;

  const membersTabTitle = room.isCollaborative
    ? `${t('common:collaborators')} (${membersTabCount})`
    : `${t('common:members')} (${membersTabCount}) `;

  const inviteMemberButtonText = room.isCollaborative
    ? t('inviteCollaboratorsButton')
    : t('inviteMembersButton');

  const membersEmptyStateTitle = room.isCollaborative
    ? t('collaboratorsEmptyStateTitle')
    : t('membersEmptyStateTitle');

  const roomMembersIcon = room.isCollaborative ? <TeamOutlined /> : <UserOutlined />;

  const showMembersTabEmptyState = !room.members.length;

  const showOverviewEmptyState = !room.overview;

  return (
    <RoomMediaContextProvider context={initialState.roomMediaContext}>
      <PageTemplate>
        <div className="RoomPage">
          <Breadcrumb className="Breadcrumbs">
            <Breadcrumb.Item href={routes.getDashboardUrl({ tab: 'rooms' })}>{t('common:roomsBreadcrumbPart')}</Breadcrumb.Item>
            <Breadcrumb.Item>{room.name}</Breadcrumb.Item>
          </Breadcrumb>
          <div className="RoomPage-title">
            <div>{room.name}</div>
            <div className="RoomPage-titleStar">
              <FavoriteStar type={FAVORITE_TYPE.room} id={room._id} />
            </div>
          </div>
          <div className="RoomPage-subtitle">
            <div>
              {t('common:by')} <a className="RoomPage-subtitleLink" href={routes.getUserProfileUrl(room.owner._id)}>{room.owner.displayName}</a>
            </div>
            {viewMode !== VIEW_MODE.owner && (
              <a className="RoomPage-leaveRoomLink" onClick={handleLeaveRoomClick}><RoomExitedIcon />{t('cancelRoomMembership')}</a>
            )}
          </div>

          {viewMode !== VIEW_MODE.owner && (
            <div className="RoomPage-documents RoomPage-documents--roomMemberView">
              {renderRoomOverview()}
              <RoomDocuments
                roomId={room._id}
                initialRoomDocumentIds={room.documents}
                initialRoomDocuments={initialState.documents}
                canDeleteDocuments={viewMode === VIEW_MODE.owner}
                canManageDocuments={viewMode === VIEW_MODE.owner || viewMode === VIEW_MODE.collaboratingMember}
                canManageDraftDocuments={viewMode === VIEW_MODE.owner}
                />
              <MessageBoard roomId={room._id} initialMessages={room.messages} canManageMessages={viewMode === VIEW_MODE.owner} />
            </div>
          )}
          {viewMode === VIEW_MODE.owner && (
            <Tabs
              className="Tabs"
              defaultActiveKey="1"
              type="line"
              size="middle"
              items={[
                {
                  key: '1',
                  label: <div><RoomIcon />{t('roomViewTitle')}</div>,
                  children: (
                    <div className="Tabs-tabPane">
                      {!!showOverviewEmptyState && (
                        <EmptyState
                          icon={<WriteIcon />}
                          title={t('overviewEmptyStateTitle')}
                          subtitle={t('overviewEmptyStateSubtitle')}
                          />
                      )}
                      {!showOverviewEmptyState && renderRoomOverview()}
                      <RoomDocuments
                        roomId={room._id}
                        initialRoomDocumentIds={room.documents}
                        initialRoomDocuments={initialState.documents}
                        canDeleteDocuments={viewMode === VIEW_MODE.owner}
                        canManageDocuments={viewMode === VIEW_MODE.owner || viewMode === VIEW_MODE.collaboratingMember}
                        canManageDraftDocuments={viewMode === VIEW_MODE.owner}
                        />
                      <MessageBoard roomId={room._id} initialMessages={room.messages} canManageMessages={viewMode === VIEW_MODE.owner} />
                    </div>
                  )
                },
                {
                  key: '2',
                  label: <div>{roomMembersIcon}{membersTabTitle}</div>,
                  children: (
                    <div className="Tabs-tabPane">
                      {!!showMembersTabEmptyState && (
                        <EmptyState
                          icon={roomMembersIcon}
                          title={membersEmptyStateTitle}
                          subtitle={t('membersEmptyStateSubtitle')}
                          button={{
                            text: inviteMemberButtonText,
                            icon: <MailOutlined />,
                            onClick: handleCreateInvitationButtonClick
                          }}
                          />
                      )}
                      {!showMembersTabEmptyState && (
                        <Fragment>
                          <Button
                            type="primary"
                            icon={<MailOutlined />}
                            className="RoomPage-tabCreateItemButton"
                            onClick={handleCreateInvitationButtonClick}
                            >
                            {inviteMemberButtonText}
                          </Button>
                          <div className="RoomPage-members">
                            {room.members.map(renderRoomMember)}
                            {invitations.map(renderRoomInvitation)}
                          </div>
                        </Fragment>
                      )}
                      <RoomInvitationCreationModal
                        isOpen={isRoomInvitationModalOpen}
                        onOk={handleInvitationModalClose}
                        onCancel={handleInvitationModalClose}
                        roomId={room._id}
                        />
                    </div>
                  )
                },
                {
                  key: '3',
                  label: <div><SettingsIcon />{t('common:settings')}</div>,
                  children: (
                    <div className="Tabs-tabPane" >
                      <div className="RoomPage-sectionHeadline">{t('roomContentHeadline')}</div>
                      <section className="RoomPage-settingsSection">
                        <Form
                          layout="vertical"
                          ref={contentFormRef}
                          name="room-content-form"
                          onFinish={handleRoomContentFormSubmitted}
                          onFieldsChange={handleRoomContentFormFieldsChanged}
                          >
                          <FormItem label={t('overview')} name="overview" initialValue={room.overview}>
                            <MarkdownInput preview />
                          </FormItem>
                        </Form>
                        <Button
                          type="primary"
                          disabled={isRoomContentUpdateButtonDisabled}
                          onClick={handleUpdateRoomContentClick}
                          >
                          {t('common:update')}
                        </Button>
                      </section>
                      <div className="RoomPage-sectionHeadline">{t('roomMetadataHeadline')}</div>
                      <section className="RoomPage-settingsSection">
                        <RoomMetadataForm
                          editMode
                          room={room}
                          formRef={metadataFormRef}
                          onSubmit={handleRoomMetadataFormSubmitted}
                          onFieldsChange={handleRoomMetadataFormFieldsChanged}
                          />
                        <Button
                          type="primary"
                          disabled={isRoomMetadataUpdateButtonDisabled}
                          onClick={handleUpdateRoomMetadataClick}
                          >
                          {t('common:update')}
                        </Button>
                      </section>
                      <IrreversibleActionsSection
                        className="RoomPage-irreversibleActionsSection"
                        actions={[
                          {
                            name: t('deleteRoomTitle'),
                            description: t('deleteRoomDescription'),
                            button: {
                              text: t('deleteRoomButton'),
                              icon: <DeleteIcon />,
                              onClick: handleDeleteRoomClick
                            }
                          }
                        ]}
                        />
                    </div>
                  )
                }
              ]}
              />
          )}
        </div>
      </PageTemplate>
    </RoomMediaContextProvider>
  );
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    room: roomShape.isRequired,
    invitations: PropTypes.arrayOf(invitationShape).isRequired,
    documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired,
    roomMediaContext: roomMediaContextShape
  }).isRequired
};
