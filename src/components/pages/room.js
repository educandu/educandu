import by from 'thenby';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import FavoriteStar from '../favorite-star.js';
import DeleteButton from '../delete-button.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import { useDateFormat } from '../locale-context.js';
import RoomMetadataForm from '../room-metadata-form.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import MoveUpIcon from '../icons/general/move-up-icon.js';
import MoveDownIcon from '../icons/general/move-down-icon.js';
import SettingsIcon from '../icons/main-menu/settings-icon.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import RoomExitedIcon from '../icons/user-activities/room-exited-icon.js';
import { ensureIsExcluded, swapItemsAt } from '../../utils/array-utils.js';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';
import { FAVORITE_TYPE, DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator } from '../../utils/room-utils.js';
import { Space, List, Button, Tabs, Card, message, Tooltip, Breadcrumb, Dropdown } from 'antd';
import { roomShape, invitationShape, documentExtendedMetadataShape } from '../../ui/default-prop-types.js';
import { confirmDocumentDelete, confirmRoomDelete, confirmRoomMemberDelete, confirmRoomInvitationDelete, confirmLeaveRoom } from '../confirmation-dialogs.js';

const logger = new Logger(import.meta.url);

function getDocumentMetadataModalState({ t, room, documentToClone = null, isOpen = false }) {
  const initialDocumentMetadata = documentToClone
    ? {
      ...documentToClone,
      title: `${documentToClone.title} ${t('common:copyTitleSuffix')}`,
      slug: documentToClone.slug ? `${documentToClone.slug}-${t('common:copySlugSuffix')}` : '',
      tags: [...documentToClone.tags]
    }
    : {
      roomId: room._id
    };

  return {
    mode: documentToClone ? DOCUMENT_METADATA_MODAL_MODE.clone : DOCUMENT_METADATA_MODAL_MODE.create,
    allowMultiple: !documentToClone,
    isOpen,
    documentToClone,
    initialDocumentMetadata,
    initialDocumentRoomMetadata: room
  };
}

function getSortedDocuments(room, documents) {
  return room.documents
    .map(documentId => documents.find(doc => doc._id === documentId))
    .filter(doc => doc);
}

export default function Room({ PageTemplate, initialState }) {
  const user = useUser();
  const formRef = useRef(null);
  const { t } = useTranslation('room');
  const { formatDate } = useDateFormat();
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [room, setRoom] = useState(initialState.room);
  const [documents, setDocuments] = useState(getSortedDocuments(room, initialState.documents));
  const [invitations, setInvitations] = useState(initialState.invitations.sort(by(x => x.sentOn)));
  const [isRoomUpdateButtonDisabled, setIsRoomUpdateButtonDisabled] = useState(true);
  const [isRoomInvitationModalOpen, setIsRoomInvitationModalOpen] = useState(false);
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ t, room }));

  const isUserRoomOwner = isRoomOwner({ room, userId: user?._id });
  const isUserRoomOwnerOrInvitedCollaborator = isRoomOwnerOrInvitedCollaborator({ room, userId: user?._id });

  useEffect(() => {
    history.replaceState(null, '', routes.getRoomUrl(room._id, room.slug));
  }, [room._id, room.slug]);

  const handleCreateInvitationButtonClick = event => {
    setIsRoomInvitationModalOpen(true);
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

  const handleNewDocumentClick = (documentToClone = null) => {
    setDocumentMetadataModalState(getDocumentMetadataModalState({ t, room, documentToClone, isOpen: true }));
  };

  const handleDocumentMetadataModalSave = (createdDocuments, templateDocumentId) => {
    const clonedOrTemplateDocumentId = documentMetadataModalState.cloneDocumentId || templateDocumentId;
    const shouldNavigateToCreatedDocument = createdDocuments.length === 1;

    if (shouldNavigateToCreatedDocument) {
      window.location = routes.getDocUrl({
        id: createdDocuments[0]._id,
        slug: createdDocuments[0].slug,
        view: DOC_VIEW_QUERY_PARAM.edit,
        templateDocumentId: clonedOrTemplateDocumentId
      });
    } else {
      setDocuments([...documents, ...createdDocuments]);
      setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleDocumentMetadataModalCancel = () => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleUpdateRoomClick = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleRoomMetadataFormSubmitted = async ({ name, slug, documentsMode, description }) => {
    try {
      const response = await roomApiClient.updateRoomMetadata({ roomId: room._id, name, slug, documentsMode, description });

      setRoom(response.room);
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
      setDocuments(ensureIsExcluded(documents, doc));
    });
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

  const handleDocumentMoveUp = async index => {
    const reorderedDocumentIds = swapItemsAt(room.documents, index, index - 1);
    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId: room._id, documentIds: reorderedDocumentIds });
    setRoom(response.room);
    setDocuments(getSortedDocuments(response.room, documents));
  };

  const handleDocumentMoveDown = async index => {
    const reorderedDocumentIds = swapItemsAt(room.documents, index, index + 1);
    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId: room._id, documentIds: reorderedDocumentIds });
    setRoom(response.room);
    setDocuments(getSortedDocuments(response.room, documents));
  };

  const handleDocumentMenuClick = (doc, index, menuItem) => {
    switch (menuItem.key) {
      case 'clone':
        return handleNewDocumentClick(doc);
      case 'delete':
        return handleDeleteDocumentClick(doc);
      case 'moveUp':
        return handleDocumentMoveUp(index);
      case 'moveDown':
        return handleDocumentMoveDown(index);
      default:
        throw new Error(`Unknown key: ${menuItem.key}`);
    }
  };

  const renderDocumentMenu = (doc, index, documentsSubset) => {
    const items = [
      {
        key: 'clone',
        label: t('common:clone'),
        icon: <DuplicateIcon className="u-dropdown-icon" />
      },
      {
        key: 'moveUp',
        label: t('common:moveUp'),
        icon: <MoveUpIcon className="u-dropdown-icon" />,
        disabled: doc.roomContext.draft || index === 0
      },
      {
        key: 'moveDown',
        label: t('common:moveDown'),
        icon: <MoveDownIcon className="u-dropdown-icon" />,
        disabled: doc.roomContext.draft || index === documentsSubset.length - 1
      }
    ];

    if (isUserRoomOwner) {
      items.push({
        key: 'delete',
        label: t('common:delete'),
        icon: <DeleteIcon className="u-dropdown-icon" />,
        danger: true
      });
    }

    return (
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{ items, onClick: menuItem => handleDocumentMenuClick(doc, index, menuItem) }}
        >
        <Button type="ghost" icon={<SettingsIcon />} size="small" />
      </Dropdown>
    );
  };

  const renderDocument = (doc, index, documentsSubset) => {
    const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });

    return (
      <div key={doc._id} className="RoomPage-documentRow">
        <div className="RoomPage-documentRowTitle">
          <a href={url}>{doc.title}</a>
        </div>
        <div className="RoomPage-documentRowMenu">
          {!!doc.roomContext.draft && (<div className="RoomPage-documentRowDraftLabel">{t('common:draft')}</div>)}
          {!!isUserRoomOwnerOrInvitedCollaborator && renderDocumentMenu(doc, index, documentsSubset)}
        </div>
      </div>
    );
  };

  const renderRoomMembers = () => {
    const title = isUserRoomOwner && t('roomMembersHeader', { count: room.members.length });
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
                <span>{member.displayName}</span>
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
              {!!isUserRoomOwner && (
                <Tooltip title={t('revokeInvitation')}>
                  <DeleteButton className="RoomPage-deleteButton" onClick={() => handleRemoveRoomInvitationClick(invitation)} />
                </Tooltip>
              )}
              <span className="RoomPage-membersRowDate">{formatDate(invitation.sentOn)}</span>
              <span>{invitation.email}</span>
            </Space>
            <Space>
              <span>{t('expires')}:</span>
              <span className="RoomPage-membersRowDate">{formatDate(invitation.expiresOn)}</span>
            </Space>
          </List.Item>
        )}
        />
    </Card>
  );

  const renderRoomDocumentsCard = () => {
    const nonDraftDocuments = documents.filter(doc => !doc.roomContext.draft);
    const draftDocuments = documents.filter(doc => doc.roomContext.draft);

    return (
      <Card
        className="RoomPage-card"
        actions={!!isUserRoomOwnerOrInvitedCollaborator && [
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
        {!!room.description && <Markdown className="RoomPage-description">{room.description}</Markdown>}
        {!documents.length && t('documentsPlaceholder')}
        {nonDraftDocuments.map((doc, index) => renderDocument(doc, index, nonDraftDocuments))}
        {draftDocuments.map((doc, index) => renderDocument(doc, index, draftDocuments))}
      </Card>
    );
  };

  const documentsModeText = t(`${room.documentsMode}DocumentsSubtitle`);
  const renderOwnerLink = () => (
    <Fragment>
      {t('common:owner')}: <a className="RoomPage-subtitleLink" href={routes.getUserUrl(room.owner._id)}>{room.owner.displayName}</a>
    </Fragment>
  );

  return (
    <PageTemplate>
      <div className="RoomPage">
        <Breadcrumb className="Breadcrumbs">
          <Breadcrumb.Item href={routes.getDashboardUrl({ tab: 'rooms' })}>{t('common:roomsBreadcrumbPart')}</Breadcrumb.Item>
          <Breadcrumb.Item>{room.name}</Breadcrumb.Item>
        </Breadcrumb>
        <div className="RoomPage-title">
          <h1 className="RoomPage-titleText">{room.name}</h1>
          <div className="RoomPage-titleExtra">
            <FavoriteStar type={FAVORITE_TYPE.room} id={room._id} />
          </div>
        </div>
        <div className="RoomPage-subtitle">
          <div>{documentsModeText} | {renderOwnerLink()}</div>
          {!isUserRoomOwner && (
            <a className="RoomPage-leaveRoomLink" onClick={handleLeaveRoomClick}><RoomExitedIcon />{t('cancelRoomMembership')}</a>
          )}
        </div>

        {!isUserRoomOwner && renderRoomDocumentsCard()}

        {!!isUserRoomOwner && (
          <Tabs
            className="Tabs"
            defaultActiveKey="1"
            type="line"
            size="middle"
            items={[
              {
                key: '1',
                label: t('documentsTabTitle'),
                children: (
                  <div className="Tabs-tabPane">
                    {renderRoomDocumentsCard()}
                  </div>
                )
              },
              {
                key: '2',
                label: t('membersTabTitle'),
                children: (
                  <div className="Tabs-tabPane">
                    {renderRoomMembers()}
                    {renderRoomInvitations()}
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
                label: t('settingsTabTitle'),
                children: (
                  <div className="Tabs-tabPane" >
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
                            danger
                            type="primary"
                            icon={<DeleteIcon />}
                            onClick={handleDeleteRoomClick}
                            >
                            {t('deleteRoomButton')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )
              }
            ]}
            />
        )}

        <DocumentMetadataModal
          {...documentMetadataModalState}
          onSave={handleDocumentMetadataModalSave}
          onClose={handleDocumentMetadataModalCancel}
          />
      </div>
    </PageTemplate>
  );
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    room: roomShape.isRequired,
    invitations: PropTypes.arrayOf(invitationShape).isRequired,
    documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired
  }).isRequired
};
