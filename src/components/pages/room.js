import by from 'thenby';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from '../markdown.js';
import UserCard from '../user-card.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import FavoriteStar from '../favorite-star.js';
import DeleteButton from '../delete-button.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../locale-context.js';
import RoomMetadataForm from '../room-metadata-form.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import MoveUpIcon from '../icons/general/move-up-icon.js';
import MoveDownIcon from '../icons/general/move-down-icon.js';
import { DragOutlined, MailOutlined } from '@ant-design/icons';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import DragAndDropContainer from '../drag-and-drop-container.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { Button, Tabs, message, Tooltip, Breadcrumb } from 'antd';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import RoomExitedIcon from '../icons/user-activities/room-exited-icon.js';
import IrreversibleActionsSection from '../irreversible-actions-section.js';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';
import { FAVORITE_TYPE, DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import { isRoomInvitedCollaborator, isRoomOwner } from '../../utils/room-utils.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import { ensureIsExcluded, moveItem, swapItemsAt } from '../../utils/array-utils.js';
import React, { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { roomShape, invitationShape, documentExtendedMetadataShape } from '../../ui/default-prop-types.js';
import { confirmDocumentDelete, confirmRoomDelete, confirmRoomMemberDelete, confirmRoomInvitationDelete, confirmLeaveRoom } from '../confirmation-dialogs.js';

const logger = new Logger(import.meta.url);

const VIEW_MODE = {
  owner: 'owner',
  collaborator: 'collaborator',
  member: 'member'
};

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
  const droppableIdRef = useRef(useId());
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [room, setRoom] = useState(initialState.room);
  const [documents, setDocuments] = useState(getSortedDocuments(room, initialState.documents));
  const [invitations, setInvitations] = useState(initialState.invitations.sort(by(x => x.sentOn)));
  const [isRoomUpdateButtonDisabled, setIsRoomUpdateButtonDisabled] = useState(true);
  const [isRoomInvitationModalOpen, setIsRoomInvitationModalOpen] = useState(false);
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ t, room }));

  const viewMode = useMemo(() => {
    if (isRoomOwner({ room, userId: user?._id })) {
      return VIEW_MODE.owner;
    }
    if (isRoomInvitedCollaborator({ room, userId: user?._id })) {
      return VIEW_MODE.collaborator;
    }
    return VIEW_MODE.member;
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
      message.success(t('common:changesSavedSuccessfully'));
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
      message.success(t('common:changesSavedSuccessfully'));
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
    message.success(t('common:changesSavedSuccessfully'));
  };

  const handleDocumentMoveDown = async index => {
    const reorderedDocumentIds = swapItemsAt(room.documents, index, index + 1);
    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId: room._id, documentIds: reorderedDocumentIds });
    setRoom(response.room);
    setDocuments(getSortedDocuments(response.room, documents));
    message.success(t('common:changesSavedSuccessfully'));
  };

  const handleDocumentMove = async (fromIndex, toIndex) => {
    const reorderedDocumentIds = moveItem(room.documents, fromIndex, toIndex);
    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId: room._id, documentIds: reorderedDocumentIds });
    setRoom(response.room);
    setDocuments(getSortedDocuments(response.room, documents));
    message.success(t('common:changesSavedSuccessfully'));
  };

  const handleActionButtonClick = (doc, docIndex, actionButton) => {
    switch (actionButton.key) {
      case 'clone':
        return handleNewDocumentClick(doc);
      case 'delete':
        return handleDeleteDocumentClick(doc);
      case 'moveUp':
        return handleDocumentMoveUp(docIndex);
      case 'moveDown':
        return handleDocumentMoveDown(docIndex);
      default:
        throw new Error(`Unknown key: ${actionButton.key}`);
    }
  };

  const renderOwnerLink = () => (
    <Fragment>
      {t('common:owner')}: <a className="RoomPage-subtitleLink" href={routes.getUserProfileUrl(room.owner._id)}>{room.owner.displayName}</a>
    </Fragment>
  );

  const renderRoomDescription = () => {
    return !!room.description && <Markdown className="RoomPage-description">{room.description}</Markdown>;
  };

  const renderCreateDocumentButton = () => {
    return (
      <Button type="primary" className="RoomPage-tabCreateItemButton" onClick={() => handleNewDocumentClick()} >
        {t('common:createDocument')}
      </Button>
    );
  };

  const renderDocumentActionButtons = ({ doc, index, docsCount, dragHandleProps }) => {
    const actionButtons = [
      {
        key: 'dragHandle',
        title: t('common:dragToReorder'),
        icon: <div {...dragHandleProps}><DragOutlined /></div>,
        disabled: doc.roomContext.draft || docsCount === 1
      },
      {
        key: 'moveUp',
        title: t('common:moveUp'),
        icon: <MoveUpIcon />,
        disabled: doc.roomContext.draft || index === 0
      },
      {
        key: 'moveDown',
        title: t('common:moveDown'),
        icon: <MoveDownIcon />,
        disabled: doc.roomContext.draft || index === docsCount - 1
      },
      {
        key: 'clone',
        title: t('common:duplicate'),
        icon: <DuplicateIcon />
      }
    ];

    if (viewMode === VIEW_MODE.owner) {
      actionButtons.push({
        key: 'delete',
        title: t('common:delete'),
        icon: <DeleteIcon />,
        danger: true
      });
    }

    return actionButtons.map(actionButton => (
      <div key={actionButton.key}>
        <Tooltip title={actionButton.title}>
          <Button
            type="text"
            size="small"
            icon={actionButton.icon}
            disabled={actionButton.disabled}
            className={classNames('u-action-button', { 'u-danger-action-button': actionButton.danger })}
            onClick={() => handleActionButtonClick(doc, index, actionButton)}
            />
        </Tooltip>
      </div>
    ));
  };

  const renderDocumentWithActionButtons = ({ doc, actionButtons, isDragged, isOtherDragged }) => {
    const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });
    const classes = classNames(
      'RoomPage-document',
      { 'is-dragged': isDragged },
      { 'is-other-dragged': isOtherDragged },
      { 'RoomPage-document--withActionButtons': !!actionButtons }
    );

    return (
      <div key={doc._id} className={classes}>
        <div className="RoomPage-documentTitle">
          <a href={url}>{doc.title}</a>
        </div>
        <div className="RoomPage-documentActionButtons">
          {!!doc.roomContext.draft && (<div className="RoomPage-documentDraftLabel">{t('common:draft')}</div>)}
          {actionButtons}
        </div>
      </div>
    );
  };

  const renderDocumentsAsReadOnly = () => {
    if (!documents.length) {
      return null;
    }

    return (
      <div className="RoomPage-documents">
        {documents.map(doc => {
          const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });

          return (
            <div key={doc._id} className="RoomPage-document">
              <div className="RoomPage-documentTitle">
                <a href={url}>{doc.title}</a>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderNonDraftDocumentsAsDraggable = () => {
    const nonDraftDocuments = documents.filter(doc => !doc.roomContext.draft);
    const docsCount = nonDraftDocuments.length;

    if (!docsCount) {
      return null;
    }

    const draggableItems = nonDraftDocuments.map((doc, index) => ({
      key: doc._id,
      render: ({ dragHandleProps, isDragged, isOtherDragged }) => {
        const actionButtons = renderDocumentActionButtons({ doc, index, docsCount, dragHandleProps });
        return renderDocumentWithActionButtons({ doc, actionButtons, isDragged, isOtherDragged });
      }
    }));

    return (
      <DragAndDropContainer
        droppableId={droppableIdRef.current}
        items={draggableItems}
        onItemMove={handleDocumentMove}
        />
    );
  };

  const renderDraftDocuments = () => {
    const draftDocuments = documents.filter(doc => doc.roomContext.draft);
    const docsCount = draftDocuments.length;

    if (!docsCount) {
      return null;
    }

    return (
      <div className="RoomPage-documents">
        {draftDocuments.map((doc, index) => {
          const actionButtons = renderDocumentActionButtons({ doc, index, docsCount });
          return renderDocumentWithActionButtons({ doc, actionButtons });
        })}
      </div>
    );
  };

  const renderRoomMember = member => {
    return (
      <div className="RoomPage-member" key={member.userId}>
        <UserCard
          userId={member.userId}
          displayName={member.displayName}
          email={member.email}
          avatarUrl={member.avatarUrl}
          detail={
            <div className="RoomPage-memberDetails">
              {`${t('memberSince')}: ${formatDate(member.joinedOn)}`}
            </div>
          }
          />
        <Tooltip title={t('removeMember')}>
          <DeleteButton className="RoomPage-memberDeleteButton" onClick={() => handleDeleteRoomMemberClick(member)} />
        </Tooltip>
      </div>
    );
  };

  const renderRoomInvitation = invitation => {
    return (
      <div className="RoomPage-member" key={invitation._id}>
        <UserCard
          userId={invitation.userId}
          displayName={<i>{t('pendingInvitation')}</i>}
          email={invitation.email}
          avatarUrl={invitation.avatarUrl}
          detail={
            <div className="RoomPage-memberDetails">
              <span className="RoomPage-memberDetail">{`${t('invitedOn')}: ${formatDate(invitation.sentOn)}`}</span>
              <span className="RoomPage-memberDetail">{`${t('expiresOn')}: ${formatDate(invitation.expiresOn)}`}</span>
            </div>
          }
          />
        {viewMode === VIEW_MODE.owner && (
        <Tooltip title={t('revokeInvitation')}>
          <DeleteButton className="RoomPage-memberDeleteButton" onClick={() => handleRemoveRoomInvitationClick(invitation)} />
        </Tooltip>
        )}
      </div>
    );
  };

  const documentsModeText = t(`${room.documentsMode}DocumentsSubtitle`);

  const membersTabCount = invitations.length
    ? `${room.members.length}/${room.members.length + invitations.length}`
    : room.members.length;

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
          {viewMode !== VIEW_MODE.owner && (
            <a className="RoomPage-leaveRoomLink" onClick={handleLeaveRoomClick}><RoomExitedIcon />{t('cancelRoomMembership')}</a>
          )}
        </div>

        {viewMode !== VIEW_MODE.owner && (
          <div className="RoomPage-documents RoomPage-documents--roomMemberView">
            {renderRoomDescription()}
            {viewMode === VIEW_MODE.collaborator && renderCreateDocumentButton()}
            {!documents.length && t('documentsPlaceholder')}
            {viewMode === VIEW_MODE.member && renderDocumentsAsReadOnly()}
            {viewMode === VIEW_MODE.collaborator && renderNonDraftDocumentsAsDraggable()}
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
                label: t('documentsTabTitle', { count: documents.length }),
                children: (
                  <div className="Tabs-tabPane">
                    {renderCreateDocumentButton()}
                    {!documents.length && t('documentsPlaceholder')}
                    {renderNonDraftDocumentsAsDraggable()}
                    {renderDraftDocuments()}
                  </div>
                )
              },
              {
                key: '2',
                label: t('membersTabTitle', { count: membersTabCount }),
                children: (
                  <div className="Tabs-tabPane">
                    <Button
                      type="primary"
                      icon={<MailOutlined />}
                      className="RoomPage-tabCreateItemButton"
                      onClick={handleCreateInvitationButtonClick}
                      >
                      {t('inviteMembersButton')}
                    </Button>
                    <div className="RoomPage-members">
                      {room.members.map(renderRoomMember)}
                      {invitations.map(renderRoomInvitation)}
                    </div>
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
                    <div className="RoomPage-sectionHeadline">{t('roomMetadataHeadline')}</div>
                    <section className="RoomPage-metadataSection">
                      <RoomMetadataForm
                        formRef={formRef}
                        room={room}
                        editMode
                        onSubmit={handleRoomMetadataFormSubmitted}
                        onFieldsChange={handleRoomMetadataFormFieldsChanged}
                        />
                      <Button
                        type="primary"
                        disabled={isRoomUpdateButtonDisabled}
                        onClick={handleUpdateRoomClick}
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
