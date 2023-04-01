import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import EmptyState from '../empty-state.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import FavoriteStar from '../favorite-star.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import RoomMembers from '../room/room-members.js';
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
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { RoomMediaContextProvider } from '../room-media-context.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import RoomExitedIcon from '../icons/user-activities/room-exited-icon.js';
import IrreversibleActionsSection from '../irreversible-actions-section.js';
import { confirmRoomDelete, confirmLeaveRoom } from '../confirmation-dialogs.js';
import { isRoomInvitedCollaborator, isRoomOwner } from '../../utils/room-utils.js';
import { roomShape, roomInvitationShape, documentExtendedMetadataShape, roomMediaContextShape } from '../../ui/default-prop-types.js';

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
  const [membersCount, setMembersCount] = useState(initialState.room.members.length);
  const [invitationsCount, setInvitationsCount] = useState(initialState.invitations.length);

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

  const handleRoomMembersChange = info => {
    setMembersCount(info.membersCount);
    setInvitationsCount(info.invitationsCount);
  };

  const renderRoomOverview = () => {
    return <Markdown className="RoomPage-overview">{room.overview}</Markdown>;
  };

  const membersTabIcon = room.isCollaborative ? <TeamOutlined /> : <UserOutlined />;
  const membersTabCount = invitationsCount
    ? `${membersCount}/${membersCount + invitationsCount}`
    : membersCount;

  const membersTabTitle = room.isCollaborative
    ? `${t('common:collaborators')} (${membersTabCount})`
    : `${t('common:members')} (${membersTabCount}) `;

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
                  label: <div>{membersTabIcon}{membersTabTitle}</div>,
                  children: (
                    <div className="Tabs-tabPane">
                      <RoomMembers
                        roomId={room._id}
                        roomIsCollaborative={room.isCollaborative}
                        initialRoomMembers={initialState.room.members}
                        initialRoomInvitations={initialState.invitations}
                        onChange={handleRoomMembersChange}
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
    invitations: PropTypes.arrayOf(roomInvitationShape).isRequired,
    documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired,
    roomMediaContext: roomMediaContextShape
  }).isRequired
};
