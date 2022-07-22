import by from 'thenby';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import FavoriteStar from '../favorite-star.js';
import DeleteButton from '../delete-button.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import MetadataTitle from '../metadata-title.js';
import roomUtils from '../../utils/room-utils.js';
import { useDateFormat } from '../locale-context.js';
import { useSettings } from '../settings-context.js';
import RoomMetadataForm from '../room-metadata-form.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import PublicIcon from '../icons/general/public-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import PrivateIcon from '../icons/general/private-icon.js';
import React, { useEffect, useRef, useState } from 'react';
import documentsUtils from '../../utils/documents-utils.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import RoomExitedIcon from '../icons/user-activities/room-exited-icon.js';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';
import { Space, List, Button, Tabs, Card, message, Tooltip, Breadcrumb } from 'antd';
import { FAVORITE_TYPE, DOC_VIEW_QUERY_PARAM, ROOM_ACCESS } from '../../domain/constants.js';
import { roomShape, invitationShape, documentMetadataShape } from '../../ui/default-prop-types.js';
import DocumentMetadataModal, { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal.js';
import { confirmDocumentDelete, confirmRoomDelete, confirmRoomMemberDelete, confirmRoomInvitationDelete, confirmLeaveRoom } from '../confirmation-dialogs.js';

const { TabPane } = Tabs;

const logger = new Logger(import.meta.url);

const sortDocuments = documents => [...documents].sort(by(l => l.dueOn || l.createdOn));

function getDocumentMetadataModalState({ documentToClone, room, settings, t }) {
  return {
    isVisible: false,
    cloneDocumentId: documentToClone?._id,
    templateDocumentId: documentToClone ? null : settings.templateDocument?.documentId,
    initialDocumentMetadata: documentToClone
      ? {
        ...documentToClone,
        title: `${documentToClone.title} ${t('common:copyTitleSuffix')}`,
        slug: documentToClone.slug ? `${documentToClone.slug}-${t('common:copySlugSuffix')}` : '',
        tags: [...documentToClone.tags]
      }
      : {
        roomId: room._id
      }
  };
}

export default function Room({ PageTemplate, initialState }) {
  const user = useUser();
  const now = new Date();
  const formRef = useRef(null);
  const settings = useSettings();
  const { t } = useTranslation('room');
  const { formatDate, formatTimeTo } = useDateFormat();
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [room, setRoom] = useState(initialState.room);
  const [documents, setDocuments] = useState(sortDocuments(initialState.documents));
  const [invitations, setInvitations] = useState(initialState.invitations.sort(by(x => x.sentOn)));
  const [isRoomUpdateButtonDisabled, setIsRoomUpdateButtonDisabled] = useState(true);
  const [isRoomInvitationModalVisible, setIsRoomInvitationModalVisible] = useState(false);
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ room, settings, t }));

  const isRoomOwner = user?._id === room.owner.key;
  const isRoomOwnerOrCollaborator = roomUtils.isRoomOwnerOrCollaborator({ room, userId: user?._id });

  const isRoomDeletionDisabled = room.access === ROOM_ACCESS.public;
  const isDocumentDeletionDisabled = room.access === ROOM_ACCESS.public;
  const upcomingDueDocument = documentsUtils.determineUpcomingDueDocument(now, documents);

  useEffect(() => {
    history.replaceState(null, '', routes.getRoomUrl(room._id, room.slug));
  }, [room._id, room.slug]);

  const handleCreateInvitationButtonClick = event => {
    setIsRoomInvitationModalVisible(true);
    event.stopPropagation();
  };

  const handleRoomDelete = async () => {
    try {
      await roomApiClient.deleteRoom(room._id);
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

  const handleInvitationModalClose = newInvitation => {
    setIsRoomInvitationModalVisible(false);
    if (newInvitation) {
      setInvitations(currentInvitations => {
        const invitationsByEmail = new Map(currentInvitations.map(x => [x.email, x]));
        invitationsByEmail.set(newInvitation.email, newInvitation);
        return [...invitationsByEmail.values()].sort(by(x => x.sentOn));
      });
    }
  };

  const handleNewDocumentClick = (documentToClone = null) => {
    setDocumentMetadataModalState({
      ...getDocumentMetadataModalState({ documentToClone, room, settings, t }),
      isVisible: true
    });
  };

  const handleDocumentMetadataModalSave = (createdDocumentOrDocuments, templateDocumentId) => {
    const documentToShow = documentMetadataModalState.cloneDocumentId ? createdDocumentOrDocuments : createdDocumentOrDocuments[0];

    window.location = routes.getDocUrl({
      id: documentToShow._id,
      slug: documentToShow.slug,
      view: DOC_VIEW_QUERY_PARAM.edit,
      templateDocumentId: documentMetadataModalState.cloneDocumentId || templateDocumentId
    });

    setDocumentMetadataModalState(prev => ({ ...prev, isVisible: false }));
  };

  const handleDocumentMetadataModalCancel = () => {
    setDocumentMetadataModalState(prev => ({ ...prev, isVisible: false }));
  };

  const handleUpdateRoomClick = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleRoomMetadataFormSubmitted = async ({ name, slug, documentsMode, description }) => {
    try {
      const updatedRoom = { ...room, name, slug, documentsMode, description };
      await roomApiClient.updateRoom({ roomId: room._id, name, slug, documentsMode, description });

      setRoom(updatedRoom);
      setIsRoomUpdateButtonDisabled(true);
      message.success(t('updateRoomSuccessMessage'));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleRoomMetadataFormFieldsChanged = () => {
    setIsRoomUpdateButtonDisabled(false);
  };

  const handleDeleteDocumentClick = doc => {
    confirmDocumentDelete(t, doc.title, async () => {
      await documentApiClient.hardDeleteDocument(doc._id);
      setDocuments(sortDocuments(ensureIsExcluded(documents, doc)));
    });
  };

  const handleDeleteRoomMemberClick = member => {
    confirmRoomMemberDelete(t, member.username, async () => {
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

  const renderDocument = doc => {
    const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });
    const dueDate = upcomingDueDocument?._id === doc._id ? formatTimeTo(doc.dueOn) : null;

    const containerClasses = classNames({
      'RoomPage-documentInfo': true,
      'RoomPage-documentInfo--withIcons': isRoomOwnerOrCollaborator,
      'RoomPage-documentInfo--withDueDate': !!dueDate
    });

    return (
      <div key={doc._id} className={containerClasses}>
        {isRoomOwnerOrCollaborator && (
          <div className="RoomPage-documentInfoItem RoomPage-documentInfoItem--icons">
            <Tooltip title={t('common:clone')}>
              <Button size="small" type="link" icon={<DuplicateIcon />} onClick={() => handleNewDocumentClick(doc)} />
            </Tooltip>
            <Tooltip title={t('common:delete')}>
              <DeleteButton
                disabled={isDocumentDeletionDisabled}
                onClick={() => handleDeleteDocumentClick(doc)}
                className={classNames('RoomPage-documentDeleteButton', { 'is-disabled': isDocumentDeletionDisabled })}
                />
            </Tooltip>
          </div>
        )}
        <div className="RoomPage-documentInfoItem">
          {doc.dueOn && <span className="RoomPage-documentDueOnDate">{formatDate(doc.dueOn)}</span>}
          <a href={url}>{doc.title}</a>
        </div>
        {dueDate && (
          <div className="RoomPage-documentInfoItem">
            {dueDate}
          </div>
        )}
      </div>
    );
  };

  const renderRoomMembers = () => {
    const title = isRoomOwner && t('roomMembersHeader', { count: room.members.length });
    return (
      <Card className="RoomPage-card" title={title}>
        <List
          dataSource={room.members}
          renderItem={member => (
            <List.Item className="RoomPage-membersRow">
              <Space>
                <Tooltip title={t('removeMember')}>
                  <DeleteButton className="RoomPage-deleteButton" onClick={() => handleDeleteRoomMemberClick(member)} />
                </Tooltip>
                <span className="RoomPage-membersRowDate">{formatDate(member.joinedOn)}</span>
                <span>{member.username}</span>
              </Space>
            </List.Item>)}
          />
      </Card>
    );
  };

  const renderRoomInvitations = () => (
    <Card
      className="RoomPage-card"
      title={t('invitationsHeader', { count: invitations.length })}
      actions={[
        <Button
          className="RoomPage-cardButton"
          key="createRoomInvitation"
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="medium"
          onClick={handleCreateInvitationButtonClick}
          />
      ]}
      >
      <List
        dataSource={invitations}
        renderItem={invitation => (
          <List.Item className="RoomPage-membersRow">
            <Space>
              {isRoomOwner && (
                <Tooltip title={t('revokeInvitation')}>
                  <DeleteButton className="RoomPage-deleteButton" onClick={() => handleRemoveRoomInvitationClick(invitation)} />
                </Tooltip>
              )}
              <span className="RoomPage-membersRowDate">{formatDate(invitation.sentOn)}</span>
              <span>{invitation.email}</span>
            </Space>
            <Space>
              <span>{t('expires')}:</span>
              <span className="RoomPage-membersRowDate">{formatDate(invitation.expires)}</span>
            </Space>
          </List.Item>
        )}
        />
    </Card>
  );

  const renderRoomDocumentsCard = () => (
    <Card
      className="RoomPage-card"
      actions={isRoomOwnerOrCollaborator && [
        <Button
          className="RoomPage-cardButton"
          key="createDocument"
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="medium"
          onClick={() => handleNewDocumentClick()}
          />
      ]}
      >
      {room.description && <Markdown className="RoomPage-description" renderMedia>{room.description}</Markdown>}
      {documents.length ? documents.map(renderDocument) : t('documentsPlaceholder')}

      {isRoomOwnerOrCollaborator && isDocumentDeletionDisabled && (
        <div className="RoomPage-deletionDisabledSubtext">{t('publicDocumentDeletionNotAllowed')}</div>
      )}
    </Card>
  );

  return (
    <PageTemplate>
      <div className="RoomPage">
        <Breadcrumb className="Breadcrumbs">
          <Breadcrumb.Item href={routes.getDashboardUrl({ tab: 'rooms' })}>{t('common:roomsBreadcrumbPart')}</Breadcrumb.Item>
          <Breadcrumb.Item>{room.name}</Breadcrumb.Item>
        </Breadcrumb>
        <MetadataTitle
          text={room.name}
          extra={<FavoriteStar type={FAVORITE_TYPE.room} id={room._id} />}
          />
        <div className="RoomPage-subtitle">
          <div className="RoomPage-subtitleGroup">
            {room.access === ROOM_ACCESS.private ? <PrivateIcon /> : <PublicIcon />}
            <span>{t(`${room.access}RoomSubtitle`)} | {t(`${room.documentsMode}DocumentsSubtitle`)} | {t('common:owner')}: {room.owner.username}</span>
          </div>
          {!isRoomOwner && (
            <a className="RoomPage-subtitleGroup" onClick={handleLeaveRoomClick}><RoomExitedIcon />{t('leaveRoom')}</a>
          )}
        </div>

        {!isRoomOwner && renderRoomDocumentsCard()}

        {isRoomOwner && (
          <Tabs className="Tabs" defaultActiveKey="1" type="line" size="middle">
            <TabPane className="Tabs-tabPane" tab={t('documentsTabTitle')} key="1">
              {renderRoomDocumentsCard()}
            </TabPane>

            <TabPane className="Tabs-tabPane" tab={t('membersTabTitle')} key="2">
              {renderRoomMembers()}
              {renderRoomInvitations()}
              <RoomInvitationCreationModal
                isVisible={isRoomInvitationModalVisible}
                onOk={handleInvitationModalClose}
                onCancel={handleInvitationModalClose}
                roomId={room._id}
                />
            </TabPane>

            <TabPane className="Tabs-tabPane" tab={t('settingsTabTitle')} key="3">
              <Card className="RoomPage-card" title={t('updateRoomCardTitle')}>
                <RoomMetadataForm
                  formRef={formRef}
                  room={room}
                  onSubmit={handleRoomMetadataFormSubmitted}
                  onFieldsChange={handleRoomMetadataFormFieldsChanged}
                  editMode
                  />
                <Button
                  className="RoomPage-cardEditButton"
                  type="primary"
                  onClick={handleUpdateRoomClick}
                  disabled={isRoomUpdateButtonDisabled}
                  >
                  {t('common:update')}
                </Button>
              </Card>
              <Card className="RoomPage-card RoomPage-card--danger" title={t('roomDangerZoneCardTitle')}>
                <div className="RoomPage-cardDangerAction">
                  <div>
                    <span className="RoomPage-cardDangerActionTitle">{t('deleteRoomTitle')}</span>
                    <span className="RoomPage-cardDangerActionDescription">{t('deleteRoomDescription')}</span>
                  </div>
                  <div className="RoomPage-cardDangerActionButtonContainer">
                    <Button
                      type="primary"
                      icon={<DeleteIcon />}
                      onClick={handleDeleteRoomClick}
                      disabled={isRoomDeletionDisabled}
                      className={classNames('RoomPage-cardDangerActionButton', { 'is-disabled': isRoomDeletionDisabled })}
                      >
                      {t('deleteRoomButton')}
                    </Button>
                    {isRoomDeletionDisabled && (
                      <div className="RoomPage-deletionDisabledSubtext">{t('publicRoomDeletionNotAllowed')}</div>
                    )}
                  </div>
                </div>
              </Card>
            </TabPane>
          </Tabs>
        )}

        <DocumentMetadataModal
          mode={DOCUMENT_METADATA_MODAL_MODE.create}
          isVisible={documentMetadataModalState.isVisible}
          allowMultiple={!documentMetadataModalState.cloneDocumentId}
          templateDocumentId={documentMetadataModalState.templateDocumentId}
          initialDocumentMetadata={documentMetadataModalState.initialDocumentMetadata}
          onSave={handleDocumentMetadataModalSave}
          onClose={handleDocumentMetadataModalCancel}
          />
      </div>
    </PageTemplate>);
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    room: roomShape.isRequired,
    invitations: PropTypes.arrayOf(invitationShape).isRequired,
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired
  }).isRequired
};
