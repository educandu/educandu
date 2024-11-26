import PropTypes from 'prop-types';
import classNames from 'classnames';
import EmptyState from '../empty-state.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { Button, message, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import FileIcon from '../icons/general/file-icon.js';
import { PublishDocumentIcon } from '../icons/icons.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import MoveUpIcon from '../icons/general/move-up-icon.js';
import MoveDownIcon from '../icons/general/move-down-icon.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import DragAndDropContainer from '../drag-and-drop-container.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { useSetRoomMediaContext } from '../room-media-context.js';
import { confirmDocumentDelete } from '../confirmation-dialogs.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import { roomDocumentMetadataShape } from '../../ui/default-prop-types.js';
import React, { Fragment, useCallback, useId, useRef, useState } from 'react';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import { ensureIsExcluded, moveItem, swapItemsAt } from '../../utils/array-utils.js';

function getDocumentsByRoomDictatedOrder(roomDocumentIds, documents) {
  return roomDocumentIds
    .map(documentId => documents.find(doc => doc._id === documentId))
    .filter(doc => doc);
}

export default function RoomDocuments({
  roomId,
  initialRoomDocumentIds,
  initialRoomDocuments,
  canManageDocuments,
  canDeleteDocuments,
  canPublishDocuments,
  canManageDraftDocuments
}) {
  const droppableIdRef = useRef(useId());
  const { t } = useTranslation('roomDocuments');
  const setRoomMediaContext = useSetRoomMediaContext();
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const getDocumentMetadataModalStateForCreateMode = useCallback(() => {
    return {
      isOpen: false,
      mode: DOCUMENT_METADATA_MODAL_MODE.create,
      allowMultipleInCreateMode: true,
      allowDraftInRoomContext: !!canManageDraftDocuments,
      initialDocumentMetadata: { roomId },
    };
  }, [roomId, canManageDraftDocuments]);

  const [roomDocumentIds, setRoomDocumentIds] = useState(initialRoomDocumentIds);
  const [roomDocuments, setRoomDocuments] = useState(getDocumentsByRoomDictatedOrder(initialRoomDocumentIds, initialRoomDocuments));
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalStateForCreateMode());

  const handleNewDocumentClick = () => {
    setDocumentMetadataModalState({
      ...getDocumentMetadataModalStateForCreateMode(),
      isOpen: true
    });
  };

  const handleCloneDocumentClick = documentToClone => {
    setDocumentMetadataModalState({
      isOpen: true,
      mode: DOCUMENT_METADATA_MODAL_MODE.clone,
      documentToClone,
      allowDraftInRoomContext: !!canManageDraftDocuments,
      initialDocumentMetadata: {
        ...documentToClone,
        title: `${documentToClone.title} ${t('common:copyTitleSuffix')}`,
        slug: documentToClone.slug ? `${documentToClone.slug}-${t('common:copySlugSuffix')}` : '',
        tags: [...documentToClone.tags]
      }
    });
  };

  const handlePublishDocumentClick = documentToPublish => {
    setDocumentMetadataModalState({
      isOpen: true,
      mode: DOCUMENT_METADATA_MODAL_MODE.publish,
      initialDocumentMetadata: {
        ...documentToPublish,
        roomId: null,
        roomContext: null
      }
    });
  };

  const handleDocumentMetadataModalSave = async (newDocuments, templateDocumentId) => {
    const clonedOrTemplateDocumentId = documentMetadataModalState.cloneDocumentId || templateDocumentId;
    const shouldNavigateToCreatedDocument = newDocuments.length === 1;

    if (shouldNavigateToCreatedDocument) {
      const shouldSeeDocumentInEditMode = documentMetadataModalState.mode !== DOCUMENT_METADATA_MODAL_MODE.publish;

      window.location = routes.getDocUrl({
        id: newDocuments[0]._id,
        slug: newDocuments[0].slug,
        view: shouldSeeDocumentInEditMode ? DOC_VIEW_QUERY_PARAM.edit : null,
        templateDocumentId: clonedOrTemplateDocumentId
      });
    } else {
      const response = await roomApiClient.getRoom({ roomId });
      const newRoomDocumentIds = response.room.documents;

      setRoomDocumentIds(newRoomDocumentIds);
      setRoomDocuments(getDocumentsByRoomDictatedOrder(newRoomDocumentIds, [...roomDocuments, ...newDocuments]));
      setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
      message.success(t('common:changesSavedSuccessfully'));
    }
  };

  const handleDocumentMetadataModalCancel = () => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteDocumentClick = doc => {
    confirmDocumentDelete(t, doc.title, async () => {
      await documentApiClient.hardDeletePrivateDocument(doc._id);

      const response = await roomApiClient.getRoom({ roomId });
      const newRoomDocumentIds = response.room.documents;

      const singleRoomMediaOverview = await roomApiClient.getSingleRoomMediaOverview({ roomId });
      setRoomMediaContext(oldContext => ({ ...oldContext, singleRoomMediaOverview }));

      setRoomDocumentIds(newRoomDocumentIds);
      setRoomDocuments(getDocumentsByRoomDictatedOrder(newRoomDocumentIds, ensureIsExcluded(roomDocuments, doc)));
    });
  };

  const handleDocumentMoveUp = async movedDocIndex => {
    const idsOfVisibleDocumentsAbove = roomDocumentIds
      .filter((docId, docIndex) => {
        if (docIndex >= movedDocIndex) {
          return false;
        }

        const documentIsNotDraft = !roomDocuments.find(d => d._id === docId).roomContext.draft;
        return canManageDraftDocuments || documentIsNotDraft;
      });

    const indexOfClosestVisibleDocumentAbove = roomDocumentIds.indexOf(idsOfVisibleDocumentsAbove.slice(-1)[0]);
    const reorderedDocumentIds = swapItemsAt(roomDocumentIds, movedDocIndex, indexOfClosestVisibleDocumentAbove);

    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId, documentIds: reorderedDocumentIds });
    const newRoomDocumentIds = response.room.documents;

    setRoomDocumentIds(newRoomDocumentIds);
    setRoomDocuments(getDocumentsByRoomDictatedOrder(newRoomDocumentIds, roomDocuments));
    message.success(t('common:changesSavedSuccessfully'));
  };

  const handleDocumentMoveDown = async movedDocIndex => {
    const idsOfVisibleDocumentsBelow = roomDocumentIds.filter((docId, docIndex) => {
      if (docIndex <= movedDocIndex) {
        return false;
      }

      const documentIsNotDraft = !roomDocuments.find(d => d._id === docId).roomContext.draft;
      return canManageDraftDocuments || documentIsNotDraft;
    });
    const indexOfClosestVisibleDocumentBelow = roomDocumentIds.indexOf(idsOfVisibleDocumentsBelow[0]);
    const reorderedDocumentIds = swapItemsAt(roomDocumentIds, movedDocIndex, indexOfClosestVisibleDocumentBelow);

    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId, documentIds: reorderedDocumentIds });
    const newRoomDocumentIds = response.room.documents;

    setRoomDocumentIds(newRoomDocumentIds);
    setRoomDocuments(getDocumentsByRoomDictatedOrder(newRoomDocumentIds, roomDocuments));
    message.success(t('common:changesSavedSuccessfully'));
  };

  const handleDocumentMove = async (fromIndex, toIndex) => {
    const reorderedDocumentIds = moveItem(roomDocumentIds, fromIndex, toIndex);
    const clientSideDocumentsReordered = reorderedDocumentIds.map(_id => roomDocuments.find(doc => doc._id === _id));
    setRoomDocuments(clientSideDocumentsReordered);

    const response = await roomApiClient.updateRoomDocumentsOrder({ roomId, documentIds: reorderedDocumentIds });

    const newRoomDocumentIds = response.room.documents;
    const serverSideDocumentsReordered = getDocumentsByRoomDictatedOrder(newRoomDocumentIds, roomDocuments);

    setRoomDocumentIds(newRoomDocumentIds);
    setRoomDocuments(serverSideDocumentsReordered);
    message.success(t('common:changesSavedSuccessfully'));
  };

  const handleActionButtonClick = (doc, docIndex, actionButton) => {
    switch (actionButton.key) {
      case 'clone':
        return handleCloneDocumentClick(doc);
      case 'publish':
        return handlePublishDocumentClick(doc);
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

  const renderCreateDocumentButton = () => {
    return (
      <Button
        type="primary"
        icon={<PlusOutlined />}
        className="RoomDocuments-createDocumentButton"
        onClick={() => handleNewDocumentClick()}
        >
        {t('common:createDocument')}
      </Button>
    );
  };

  const renderDocumentActionButtons = ({ doc, docIndex, docs }) => {
    const firstVisibleDocument = canManageDraftDocuments ? docs[0] : docs.filter(d => !d.roomContext.draft)[0];
    const lastVisibleDocument = canManageDraftDocuments ? docs.slice(-1)[0] : docs.filter(d => !d.roomContext.draft).slice(-1)[0];

    const actionButtons = [
      {
        key: 'moveUp',
        title: null,
        icon: <MoveUpIcon />,
        disabled: doc._id === firstVisibleDocument?._id,
        rendered: true
      },
      {
        key: 'moveDown',
        title: null,
        icon: <MoveDownIcon />,
        disabled: doc._id === lastVisibleDocument?._id,
        rendered: true
      },
      {
        key: 'publish',
        title: t('common:publish'),
        icon: (
          <div className="RoomDocuments-documentActionButtonsPublish">
            <PublishDocumentIcon />
          </div>
        ),
        rendered: canPublishDocuments
      },
      {
        key: 'clone',
        title: t('common:duplicate'),
        icon: <DuplicateIcon />,
        rendered: true
      },
      {
        key: 'delete',
        title: t('common:delete'),
        icon: <DeleteIcon />,
        danger: true,
        rendered: canDeleteDocuments
      }
    ].filter(actionButton => actionButton.rendered);

    return actionButtons.map(actionButton => (
      <div key={actionButton.key}>
        <Tooltip title={actionButton.title}>
          <Button
            type="text"
            size="small"
            icon={actionButton.icon}
            disabled={actionButton.disabled}
            className={classNames('u-action-button', { 'u-danger-action-button': actionButton.danger })}
            onClick={() => handleActionButtonClick(doc, docIndex, actionButton)}
            />
        </Tooltip>
      </div>
    ));
  };

  const renderNonDraftDocumentsAsReadOnly = () => {
    const sortedNonDraftDocuments = getDocumentsByRoomDictatedOrder(roomDocumentIds, roomDocuments)
      .filter(doc => !doc.roomContext.draft);

    if (!sortedNonDraftDocuments.length) {
      return null;
    }

    return (
      <div>
        {sortedNonDraftDocuments.map(doc => {
          const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });

          return (
            <div key={doc._id} className="RoomDocuments-document">
              <div className="RoomDocuments-documentTitle">
                <a href={url}>{doc.title}</a>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDocumentAsManageable = ({ doc, docIndex, dragHandleProps, isDragged, isOtherDragged }) => {
    const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });
    const isHidden = !canManageDraftDocuments && !!doc.roomContext.draft;
    const actionButtons = renderDocumentActionButtons({ doc, docIndex, docs: roomDocuments });

    const classes = classNames(
      'RoomDocuments-document',
      'RoomDocuments-document--withActionButtons',
      { 'is-dragged': isDragged },
      { 'is-hidden': isHidden },
      { 'is-other-dragged': isOtherDragged }
    );

    return (
      <div key={doc._id} className={classes} {...dragHandleProps}>
        <div className="RoomDocuments-documentTitle">
          <a href={url}>{doc.title}</a>
        </div>
        <div className="RoomDocuments-documentActionButtons">
          {!!doc.roomContext.draft && (<div className="RoomDocuments-documentDraftLabel">{t('common:draft')}</div>)}
          {actionButtons}
        </div>
      </div>
    );
  };

  const renderDocumentsAsManageable = () => {
    const draggableItems = roomDocuments.map((doc, docIndex) => ({
      key: doc._id,
      render: ({ dragHandleProps, isDragged, isOtherDragged }) => {
        return renderDocumentAsManageable({ doc, docIndex, dragHandleProps, isDragged, isOtherDragged });
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

  const noDocuments = !roomDocuments.length;
  const noNonDraftDocuments = !roomDocuments.filter(r => !r.roomContext.draft).length;
  const showEmptyState = noDocuments || (!canManageDocuments && noNonDraftDocuments);

  return (
    <section className="RoomDocuments">
      <div className="RoomDocuments-headline">{t('headline')}</div>
      {!canManageDocuments && renderNonDraftDocumentsAsReadOnly()}

      {!!canManageDocuments && (
        <Fragment>
          {!!showEmptyState && (
            <EmptyState
              icon={<FileIcon />}
              title={t('emptyStateTitle')}
              subtitle={t('emptyStateSubtitle')}
              button={{
                text: t('common:createDocument'),
                icon: <PlusOutlined />,
                onClick: () => handleNewDocumentClick()
              }}
              />
          )}

          {!showEmptyState && (
            <Fragment>
              {renderCreateDocumentButton()}
              {renderDocumentsAsManageable()}
            </Fragment>
          )}

          <DocumentMetadataModal
            {...documentMetadataModalState}
            onSave={handleDocumentMetadataModalSave}
            onClose={handleDocumentMetadataModalCancel}
            />
        </Fragment>
      )}
    </section>
  );
}

RoomDocuments.propTypes = {
  roomId: PropTypes.string.isRequired,
  canManageDocuments: PropTypes.bool.isRequired,
  canDeleteDocuments: PropTypes.bool.isRequired,
  canPublishDocuments: PropTypes.bool.isRequired,
  canManageDraftDocuments: PropTypes.bool.isRequired,
  initialRoomDocumentIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialRoomDocuments: PropTypes.arrayOf(roomDocumentMetadataShape).isRequired
};
