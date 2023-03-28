import by from 'thenby';
import Info from '../info.js';
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
import MarkdownInput from '../markdown-input.js';
import { MailOutlined } from '@ant-design/icons';
import { useLoadingState } from '../../ui/hooks.js';
import { useDateFormat } from '../locale-context.js';
import RoomMetadataForm from '../room-metadata-form.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import MoveUpIcon from '../icons/general/move-up-icon.js';
import MoveDownIcon from '../icons/general/move-down-icon.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import DragAndDropContainer from '../drag-and-drop-container.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { RoomMediaContextProvider } from '../room-media-context.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import RoomExitedIcon from '../icons/user-activities/room-exited-icon.js';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import IrreversibleActionsSection from '../irreversible-actions-section.js';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';
import { FAVORITE_TYPE, DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import { Button, Tabs, message, Tooltip, Breadcrumb, Checkbox, Form } from 'antd';
import { isRoomInvitedCollaborator, isRoomOwner } from '../../utils/room-utils.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import { ensureIsExcluded, moveItem, swapItemsAt } from '../../utils/array-utils.js';
import { roomShape, invitationShape, documentExtendedMetadataShape, roomMediaContextShape } from '../../ui/default-prop-types.js';
import {
  confirmDocumentDelete,
  confirmRoomDelete,
  confirmRoomMemberDelete,
  confirmRoomInvitationDelete,
  confirmLeaveRoom,
  confirmRoomMessageDelete
} from '../confirmation-dialogs.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

const VIEW_MODE = {
  owner: 'owner',
  collaboratingMember: 'collaborating-member',
  nonCollaboratingMember: 'non-collaborating-member'
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
  const contentFormRef = useRef(null);
  const metadataFormRef = useRef(null);
  const { t } = useTranslation('room');
  const { formatDate } = useDateFormat();
  const droppableIdRef = useRef(useId());
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [room, setRoom] = useState(initialState.room);
  const [newMessageText, setNewMessageText] = useState('');
  const [isPostingNewMessage, setIsPostingNewMessage] = useLoadingState(false);
  const [isRoomInvitationModalOpen, setIsRoomInvitationModalOpen] = useState(false);
  const [newMessageEmailNotification, setNewMessageEmailNotification] = useState(false);
  const [documents, setDocuments] = useState(getSortedDocuments(room, initialState.documents));
  const [invitations, setInvitations] = useState(initialState.invitations.sort(by(x => x.sentOn)));
  const [isRoomContentUpdateButtonDisabled, setIsRoomContentUpdateButtonDisabled] = useState(true);
  const [isRoomMetadataUpdateButtonDisabled, setIsRoomMetadataUpdateButtonDisabled] = useState(true);
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ t, room }));

  const viewMode = useMemo(() => {
    if (isRoomOwner({ room, userId: user?._id })) {
      return VIEW_MODE.owner;
    }
    if (isRoomInvitedCollaborator({ room, userId: user?._id })) {
      return VIEW_MODE.collaboratingMember;
    }
    return VIEW_MODE.nonCollaboratingMember;
  }, [room, user]);

  const showDraftDocuments = useMemo(() => viewMode === VIEW_MODE.owner, [viewMode]);
  const visibleDocumentsCount = useMemo(() => documents.filter(doc => showDraftDocuments || !doc.roomContext.draft).length, [showDraftDocuments, documents]);

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

  const handleNewDocumentClick = (documentToClone = null) => {
    setDocumentMetadataModalState(getDocumentMetadataModalState({ t, room, documentToClone, isOpen: true }));
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

  const handleDocumentMetadataModalSave = async (createdDocuments, templateDocumentId) => {
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
      const response = await roomApiClient.getRoom({ roomId: room._id });
      setRoom(response.room);
      setDocuments(getSortedDocuments(response.room, [...documents, ...createdDocuments]));
      setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
      message.success(t('common:changesSavedSuccessfully'));
    }
  };

  const handleDocumentMetadataModalCancel = () => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
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

  const handleDeleteDocumentClick = doc => {
    confirmDocumentDelete(t, doc.title, async () => {
      await documentApiClient.hardDeletePrivateDocument(doc._id);
      const response = await roomApiClient.getRoom({ roomId: room._id });
      setRoom(response.room);
      setDocuments(getSortedDocuments(response.room, ensureIsExcluded(documents, doc)));
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

  const handleDocumentMoveUp = async movedDocIndex => {
    const idsOfVisibleDocumentsAbove = room.documents
      .filter((docId, docIndex) => {
        if (docIndex >= movedDocIndex) {
          return false;
        }

        const documentIsNotDraft = !documents.find(d => d._id === docId).roomContext.draft;
        return showDraftDocuments || documentIsNotDraft;
      });

    const indexOfClosestVisibleDocumentAbove = room.documents.indexOf(idsOfVisibleDocumentsAbove.slice(-1)[0]);
    const reorderedDocumentIds = swapItemsAt(room.documents, movedDocIndex, indexOfClosestVisibleDocumentAbove);

    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId: room._id, documentIds: reorderedDocumentIds });

    setRoom(response.room);
    setDocuments(getSortedDocuments(response.room, documents));
    message.success(t('common:changesSavedSuccessfully'));
  };

  const handleDocumentMoveDown = async movedDocIndex => {
    const idsOfVisibleDocumentsBelow = room.documents.filter((docId, docIndex) => {
      if (docIndex <= movedDocIndex) {
        return false;
      }

      const documentIsNotDraft = !documents.find(d => d._id === docId).roomContext.draft;
      return showDraftDocuments || documentIsNotDraft;
    });
    const indexOfClosestVisibleDocumentBelow = room.documents.indexOf(idsOfVisibleDocumentsBelow[0]);
    const reorderedDocumentIds = swapItemsAt(room.documents, movedDocIndex, indexOfClosestVisibleDocumentBelow);

    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId: room._id, documentIds: reorderedDocumentIds });

    setRoom(response.room);
    setDocuments(getSortedDocuments(response.room, documents));
    message.success(t('common:changesSavedSuccessfully'));
  };

  const handleDocumentMove = async (fromIndex, toIndex) => {
    const reorderedDocumentIds = moveItem(room.documents, fromIndex, toIndex);
    const clientSideDocumentsReordered = reorderedDocumentIds.map(_id => documents.find(doc => doc._id === _id));
    setDocuments(clientSideDocumentsReordered);

    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId: room._id, documentIds: reorderedDocumentIds });

    const serverSideDocumentsReordered = getSortedDocuments(response.room, documents);
    setRoom(response.room);
    setDocuments(serverSideDocumentsReordered);
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
        return null;
    }
  };

  const handleNewMessageTextChange = event => {
    const { value } = event.target;
    setNewMessageText(value);
  };

  const handlePostMessageClick = async () => {
    setIsPostingNewMessage(true);
    const response = await roomApiClient.addRoomMessage({
      roomId: room._id,
      text: newMessageText.trim(),
      emailNotification: newMessageEmailNotification
    });
    await setIsPostingNewMessage(false);
    setRoom(response.room);
    setNewMessageText('');
    setNewMessageEmailNotification(false);
  };

  const handleNewMessageEmailNotificationChange = event => {
    const { checked } = event.target;
    setNewMessageEmailNotification(checked);
  };

  const handleDeleteMessageClick = msg => {
    confirmRoomMessageDelete(t, formatDate(msg.createdOn), async () => {
      const response = await roomApiClient.deleteRoomMessage({ roomId: room._id, messageKey: msg.key });
      setRoom(response.room);
    });
  };

  const renderRoomOverview = () => {
    return !!room.overview && <Markdown className="RoomPage-overview">{room.overview}</Markdown>;
  };

  const renderCreateDocumentButton = () => {
    return (
      <Button type="primary" className="RoomPage-tabCreateItemButton" onClick={() => handleNewDocumentClick()} >
        {t('common:createDocument')}
      </Button>
    );
  };

  const renderDocumentActionButtons = ({ doc, index, docs }) => {
    const firstVisibleDocument = showDraftDocuments ? docs[0] : docs.filter(d => !d.roomContext.draft)[0];
    const lastVisibleDocument = showDraftDocuments ? docs.slice(-1)[0] : docs.filter(d => !d.roomContext.draft).slice(-1)[0];

    const actionButtons = [
      {
        key: 'moveUp',
        title: t('common:moveUp'),
        icon: <MoveUpIcon />,
        disabled: doc._id === firstVisibleDocument?._id
      },
      {
        key: 'moveDown',
        title: t('common:moveDown'),
        icon: <MoveDownIcon />,
        disabled: doc._id === lastVisibleDocument?._id
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

  const renderDocumentWithActionButtons = ({ doc, actionButtons, dragHandleProps, isDragged, isOtherDragged }) => {
    const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });
    const isHidden = !showDraftDocuments && !!doc.roomContext.draft;

    const classes = classNames(
      'RoomPage-document',
      { 'is-dragged': isDragged },
      { 'is-hidden': isHidden },
      { 'is-other-dragged': isOtherDragged },
      { 'RoomPage-document--withActionButtons': !!actionButtons }
    );

    return (
      <div key={doc._id} className={classes} {...dragHandleProps}>
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
    if (!visibleDocumentsCount) {
      return null;
    }

    const sortedVisibleDocumentIds = room.documents.filter(docId => documents.find(d => d._id === docId)?.roomContext.draft === false);
    const sortedVisibleDocuments = sortedVisibleDocumentIds.map(docId => documents.find(d => d._id === docId));

    return (
      <div className="RoomPage-documents">
        {sortedVisibleDocuments.map(doc => {
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

  const renderDocumentsAsDraggable = () => {
    const draggableItems = documents.map((doc, index) => ({
      key: doc._id,
      render: ({ dragHandleProps, isDragged, isOtherDragged }) => {
        const actionButtons = renderDocumentActionButtons({ doc, index, docs: documents });
        return renderDocumentWithActionButtons({ doc, actionButtons, dragHandleProps, isDragged, isOtherDragged });
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

  const renderMessages = () => {
    const sortedMessages = room.messages.sort(by(msg => msg.createdOn, 'desc'));

    return (
      <div className="RoomPage-messageBoardMessages">
        {sortedMessages.map(msg => (
          <div key={msg.key} className="RoomPage-messageBoardMessage">
            <div className="RoomPage-messageBoardMessageHeadline">
              <div>{formatDate(msg.createdOn)}</div>
              <div className="RoomPage-messageBoardMessageHeadlineIcons">
                {!!msg.emailNotification && (
                  <div className="RoomPage-messageBoardMessageIcon">
                    <Tooltip title={t('messageEmailNotificationIconTooltip')}>
                      <MailOutlined />
                    </Tooltip>
                  </div>
                )}
                {viewMode === VIEW_MODE.owner && (
                  <DeleteButton onClick={() => handleDeleteMessageClick(msg)} />
                )}
              </div>
            </div>
            <div className="RoomPage-messageBoardMessageText">
              <Markdown>{msg.text}</Markdown>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMessagePostingSection = () => {
    return (
      <div className="RoomPage-messageBoardPostingSection">
        <MarkdownInput
          preview
          value={newMessageText}
          disabled={isPostingNewMessage}
          onChange={handleNewMessageTextChange}
          />
        <div className="RoomPage-messageBoardPostingSectionControls">
          <Checkbox
            checked={newMessageEmailNotification}
            disabled={isPostingNewMessage}
            onChange={handleNewMessageEmailNotificationChange}
            >
            <Info tooltip={t('postMessageCheckboxInfo')} iconAfterContent>
              {t('postMessageCheckboxText')}
            </Info>
          </Checkbox>
          <Button
            type="primary"
            loading={isPostingNewMessage}
            disabled={!newMessageText.trim().length}
            onClick={handlePostMessageClick}
            >
            {t('postMessageButtonText')}
          </Button>
        </div>
      </div>
    );
  };

  const renderMessageBoard = () => {
    if (viewMode !== VIEW_MODE.owner && !room.messages.length) {
      return null;
    }

    return (
      <section className="RoomPage-messageBoard">
        <div className="RoomPage-messageBoardHeadline">{t('messageBoardSectionHeadline')}</div>
        {viewMode === VIEW_MODE.owner && !room.messages.length && (
          <div className="RoomPage-messageBoardOwnerInfo">
            <Markdown>{t('messageBoardOwnerInfoMarkdown')}</Markdown>
          </div>
        )}
        {viewMode === VIEW_MODE.owner && renderMessagePostingSection()}
        {renderMessages()}
      </section>
    );
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
              {viewMode === VIEW_MODE.collaboratingMember && renderCreateDocumentButton()}
              {!visibleDocumentsCount && t('documentsPlaceholder')}
              {viewMode === VIEW_MODE.nonCollaboratingMember && renderDocumentsAsReadOnly()}
              {viewMode === VIEW_MODE.collaboratingMember && renderDocumentsAsDraggable()}
              {renderMessageBoard()}
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
                  label: t('roomViewTitle'),
                  children: (
                    <div className="Tabs-tabPane">
                      {renderRoomOverview()}
                      {renderCreateDocumentButton()}
                      {!visibleDocumentsCount && t('documentsPlaceholder')}
                      {renderDocumentsAsDraggable()}
                      {renderMessageBoard()}
                    </div>
                  )
                },
                {
                  key: '2',
                  label: membersTabTitle,
                  children: (
                    <div className="Tabs-tabPane">
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
                  label: t('common:settings'),
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

          <DocumentMetadataModal
            {...documentMetadataModalState}
            onSave={handleDocumentMetadataModalSave}
            onClose={handleDocumentMetadataModalCancel}
            />
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
