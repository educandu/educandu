/* eslint-disable complexity, max-lines */
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ALERT_TYPE } from '../alert.js';
import Restricted from '../restricted.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import FavoriteStar from '../favorite-star.js';
import ControlPanel from '../control-panel.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import uniqueId from '../../utils/unique-id.js';
import CommentsPanel from '../comments-panel.js';
import CreditsFooter from '../credits-footer.js';
import { LikeOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import { useRequest } from '../request-context.js';
import { Breadcrumb, message, Tooltip } from 'antd';
import { useService } from '../container-context.js';
import SectionsDisplay from '../sections-display.js';
import PluginRegistry from '../../plugins/plugin-registry.js';
import HistoryControlPanel from '../history-control-panel.js';
import CommentsIcon from '../icons/multi-color/comments-icon.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { supportsClipboardPaste } from '../../ui/browser-helper.js';
import CommentApiClient from '../../api-clients/comment-api-client.js';
import { handleApiError, handleError } from '../../ui/error-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { canEditDocContent, canEditDocMetadata } from '../../utils/doc-utils.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import EditControlPanel, { EDIT_CONTROL_PANEL_STATUS } from '../edit-control-panel.js';
import { documentShape, roomShape, sectionShape } from '../../ui/default-prop-types.js';
import AllowedOpenContributionNoneIcon from '../icons/general/allowed-open-contribution-none-icon.js';
import AllowedOpenContributionContentIcon from '../icons/general/allowed-open-contribution-content-icon.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, DOC_VIEW_QUERY_PARAM, FAVORITE_TYPE } from '../../domain/constants.js';
import AllowedOpenContributionMetadataAndContentIcon from '../icons/general/allowed-open-contribution-metadata-and-content-icon.js';
import { ensureIsExcluded, ensureIsIncluded, insertItemAt, moveItem, removeItemAt, replaceItemAt } from '../../utils/array-utils.js';
import { createClipboardTextForSection, createNewSectionFromClipboardText, redactSectionContent } from '../../services/section-helper.js';
import {
  confirmDiscardUnsavedChanges,
  confirmDocumentRevisionRestoration,
  confirmSectionDelete,
  confirmSectionHardDelete
} from '../confirmation-dialogs.js';

const logger = new Logger(import.meta.url);

const VIEW = {
  display: 'display',
  edit: DOC_VIEW_QUERY_PARAM.edit,
  history: DOC_VIEW_QUERY_PARAM.history,
  comments: DOC_VIEW_QUERY_PARAM.comments
};

function createPageAlerts({ doc, docRevision, view, hasPendingTemplateSectionKeys, t }) {
  const alerts = [];
  const review = docRevision ? docRevision.publicContext?.review : doc.publicContext?.review;
  const archived = docRevision ? docRevision.publicContext?.archived : doc.publicContext?.archived;

  if (archived) {
    alerts.push({ message: t('common:archivedAlert') });
  }

  if (view === VIEW.edit && hasPendingTemplateSectionKeys) {
    alerts.push({ message: t('common:proposedSectionsAlert') });
  }

  if (review) {
    alerts.push({ message: review, type: ALERT_TYPE.warning });
  }

  return alerts;
}

function Doc({ initialState, PageTemplate }) {
  const user = useUser();
  const request = useRequest();
  const { t } = useTranslation('doc');
  const commentsSectionRef = useRef(null);
  const pluginRegistry = useService(PluginRegistry);
  const commentApiClient = useSessionAwareApiClient(CommentApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const { room } = initialState;

  const initialView = Object.values(VIEW).find(v => v === request.query.view) || VIEW.display;

  const userCanHardDelete = hasUserPermission(user, permissions.HARD_DELETE_SECTION);
  const userCanEditDocContent = canEditDocContent({ user, doc: initialState.doc, room });
  const userCanEditDocMetadata = canEditDocMetadata({ user, doc: initialState.doc, room });

  const [isDirty, setIsDirty] = useState(false);
  const [doc, setDoc] = useState(initialState.doc);
  const [comments, setComments] = useState([]);
  const [historyRevisions, setHistoryRevisions] = useState([]);
  const [editedSectionKeys, setEditedSectionKeys] = useState([]);
  const [invalidSectionKeys, setInvalidSectionKeys] = useState([]);
  const [view, setView] = useState(user ? initialView : VIEW.display);
  const [selectedHistoryRevision, setSelectedHistoryRevision] = useState(null);
  const [isDocumentMetadataModalVisible, setIsDocumentMetadataModalVisible] = useState(false);
  const [pendingTemplateSectionKeys, setPendingTemplateSectionKeys] = useState((initialState.templateSections || []).map(s => s.key));
  const [currentSections, setCurrentSections] = useState(cloneDeep(initialState.templateSections?.length ? initialState.templateSections : doc.sections));

  const [alerts, setAlerts] = useState(createPageAlerts({
    t,
    doc,
    view,
    hasPendingTemplateSectionKeys: !!pendingTemplateSectionKeys.length
  }));

  const fetchComments = useCallback(async () => {
    try {
      const response = await commentApiClient.getAllDocumentComments({ documentId: doc._id });
      setComments(response.comments);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  }, [doc, commentApiClient, t]);

  useEffect(() => {
    setAlerts(createPageAlerts({
      t,
      doc,
      docRevision: selectedHistoryRevision,
      view,
      hasPendingTemplateSectionKeys: !!pendingTemplateSectionKeys.length
    }));
  }, [doc, selectedHistoryRevision, view, pendingTemplateSectionKeys, t]);

  useEffect(() => {
    if (initialView === VIEW.edit || view === VIEW.edit) {
      pluginRegistry.ensureAllEditorsAreLoaded();
    }

    if (initialView === VIEW.history) {
      (async () => {
        try {
          const { documentRevisions } = await documentApiClient.getDocumentRevisions(doc._id);
          setHistoryRevisions(documentRevisions);
          setSelectedHistoryRevision(documentRevisions[documentRevisions.length - 1]);
        } catch (error) {
          handleApiError({ error, t, logger });
        }
      })();
    }

    if (initialView === VIEW.comments) {
      (async () => {
        await fetchComments();
      })();
    }
  }, [initialView, doc._id, view, t, pluginRegistry, documentApiClient, fetchComments]);

  useEffect(() => {
    const viewQueryValue = view === VIEW.display ? null : view;
    history.replaceState(null, '', routes.getDocUrl({ id: doc._id, slug: doc.slug, view: viewQueryValue }));
  }, [user, doc._id, doc.slug, view]);

  useEffect(() => {
    if (view === VIEW.comments) {
      commentsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [view]);

  const handleEditMetadataOpen = () => {
    setIsDocumentMetadataModalVisible(true);
  };

  const handleDocumentMetadataModalSave = updatedDocuments => {
    setDoc(updatedDocuments[0]);
    setIsDocumentMetadataModalVisible(false);
    message.success(t('documentMetadataUpdated'));
  };

  const handleDocumentMetadataModalClose = () => {
    setIsDocumentMetadataModalVisible(false);
  };

  const handleEditOpen = () => {
    setView(VIEW.edit);
    setCurrentSections(cloneDeep(doc.sections));
  };

  const handleEditSave = async () => {
    const newSections = currentSections.filter(s => !pendingTemplateSectionKeys.includes(s.key)).map(s => ({
      key: s.key,
      type: s.type,
      content: s.content
    }));

    try {
      const updatedDoc = await documentApiClient.updateDocumentSections({ documentId: doc._id, sections: newSections });

      const currentSectionKeys = currentSections.map(s => s.key);
      if (updatedDoc.sections.some(s => !currentSectionKeys.includes(s.key))) {
        throw new Error('Updated sections do not match existing sections');
      }

      const newPendingTemplateSectionKeys = [];
      const mergedSections = currentSections.map(currentSection => {
        const updatedSection = updatedDoc.sections.find(s => s.key === currentSection.key);
        if (updatedSection) {
          return updatedSection;
        }

        newPendingTemplateSectionKeys.push(currentSection.key);
        return currentSection;
      });

      setIsDirty(false);
      setDoc(updatedDoc);
      setCurrentSections(cloneDeep(mergedSections));
      setPendingTemplateSectionKeys(newPendingTemplateSectionKeys);
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleEditClose = () => {
    return new Promise(resolve => {
      const exitEditMode = () => {
        setCurrentSections(doc.sections);
        setIsDirty(false);
        setView(VIEW.display);
        setEditedSectionKeys([]);
        setInvalidSectionKeys([]);
        setPendingTemplateSectionKeys([]);
        resolve(true);
      };

      if (isDirty) {
        confirmDiscardUnsavedChanges(t, exitEditMode, () => resolve(false));
      } else {
        exitEditMode();
      }
    });
  };

  const handleCommentsOpen = async () => {
    await fetchComments();
    setView(VIEW.comments);
  };

  const handleCommentsClose = () => {
    setView(VIEW.display);
    setComments([]);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    return true;
  };

  const handleSectionContentChange = (index, newContent, isInvalid) => {
    const modifiedSection = {
      ...currentSections[index],
      content: newContent
    };

    const newSections = replaceItemAt(currentSections, modifiedSection, index);
    setCurrentSections(newSections);
    setInvalidSectionKeys(keys => isInvalid ? ensureIsIncluded(keys, modifiedSection.key) : ensureIsExcluded(keys, modifiedSection.key));
    setIsDirty(true);
  };

  const handleSectionMove = (sourceIndex, destinationIndex) => {
    const reorderedSections = moveItem(currentSections, sourceIndex, destinationIndex);
    setCurrentSections(reorderedSections);
    setIsDirty(true);
  };

  const handleSectionInsert = (pluginType, index) => {
    const pluginInfo = pluginRegistry.getInfo(pluginType);
    const newSection = {
      key: uniqueId.create(),
      type: pluginType,
      content: pluginInfo.getDefaultContent(t)
    };
    const newSections = insertItemAt(currentSections, newSection, index);
    setCurrentSections(newSections);
    setIsDirty(true);
  };

  const handleSectionDuplicate = index => {
    const originalSection = currentSections[index];
    const duplicatedSection = cloneDeep(originalSection);
    duplicatedSection.key = uniqueId.create();

    const expandedSections = insertItemAt(currentSections, duplicatedSection, index + 1);
    setCurrentSections(expandedSections);
    setIsDirty(true);
    if (invalidSectionKeys.includes(originalSection.key)) {
      setInvalidSectionKeys(keys => ensureIsIncluded(keys, duplicatedSection.key));
    }
  };

  const handleSectionCopyToClipboard = async index => {
    const originalSection = currentSections[index];
    const clipboardText = createClipboardTextForSection(originalSection, request.hostInfo.origin);
    try {
      await window.navigator.clipboard.writeText(clipboardText);
      message.success(t('common:sectionCopiedToClipboard'));
    } catch (error) {
      handleError({ message: t('common:copySectionToClipboardError'), error, logger, t, duration: 30 });
    }
  };

  const handleSectionPasteFromClipboard = async index => {
    if (!supportsClipboardPaste()) {
      message.error(t('common:clipboardPasteNotSupported'), 10);
      return false;
    }

    try {
      const targetRoomId = room?._id || null;
      const clipboardText = await window.navigator.clipboard.readText();
      const newSection = createNewSectionFromClipboardText(clipboardText, request.hostInfo.origin);
      const redactedSection = redactSectionContent({ section: newSection, pluginRegistry, targetRoomId });
      const newSections = insertItemAt(currentSections, redactedSection, index);
      setCurrentSections(newSections);
      setIsDirty(true);
      return true;
    } catch (error) {
      handleError({ message: t('common:pasteSectionFromClipboardError'), error, logger, t, duration: 30 });
      return false;
    }
  };

  const handleSectionDelete = index => {
    confirmSectionDelete(
      t,
      () => {
        const section = currentSections[index];
        const reducedSections = removeItemAt(currentSections, index);
        setEditedSectionKeys(keys => ensureIsExcluded(keys, section.key));
        setInvalidSectionKeys(keys => ensureIsExcluded(keys, section.key));
        setCurrentSections(reducedSections);
        setIsDirty(true);
      }
    );
  };

  const handleSectionEditEnter = index => {
    const section = currentSections[index];
    setEditedSectionKeys(keys => ensureIsIncluded(keys, section.key));
  };

  const handleSectionEditLeave = index => {
    const section = currentSections[index];
    setEditedSectionKeys(keys => ensureIsExcluded(keys, section.key));
  };

  const handlePendingSectionApply = index => {
    const appliedSectionKey = currentSections[index].key;
    setPendingTemplateSectionKeys(prevKeys => ensureIsExcluded(prevKeys, appliedSectionKey));
    setIsDirty(true);
  };

  const handlePendingSectionDiscard = index => {
    const discardedSection = currentSections[index];
    setCurrentSections(prevSections => ensureIsExcluded(prevSections, discardedSection));
    setIsDirty(true);
  };

  const handleHistoryOpen = async () => {
    try {
      const { documentRevisions } = await documentApiClient.getDocumentRevisions(doc._id);
      setHistoryRevisions(documentRevisions);
      setSelectedHistoryRevision(documentRevisions[documentRevisions.length - 1]);
      setView(VIEW.history);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleHistoryClose = () => {
    setHistoryRevisions([]);
    setSelectedHistoryRevision(null);
    setView(VIEW.display);
    return true;
  };

  const handlePermalinkRequest = async () => {
    const permalinkUrl = urlUtils.createFullyQualifiedUrl(routes.getDocumentRevisionUrl(selectedHistoryRevision._id));
    try {
      await window.navigator.clipboard.writeText(permalinkUrl);
      message.success(t('permalinkCopied'));
    } catch (error) {
      const msg = (
        <span>
          <span>{t('permalinkCouldNotBeCopied')}:</span>
          <br />
          <a href={permalinkUrl}>{permalinkUrl}</a>
        </span>
      );
      message.error(msg, 10);
    }
  };

  const handleSelectedRevisionChange = index => {
    setSelectedHistoryRevision(historyRevisions[index]);
  };

  const handleRestoreRevision = () => {
    confirmDocumentRevisionRestoration(
      t,
      selectedHistoryRevision,
      async () => {
        try {
          const { document: updatedDoc, documentRevisions } = await documentApiClient.restoreDocumentRevision({
            documentId: selectedHistoryRevision.documentId,
            revisionId: selectedHistoryRevision._id
          });

          setDoc(updatedDoc);
          setCurrentSections(updatedDoc.sections);
          setHistoryRevisions(documentRevisions);
          setSelectedHistoryRevision(documentRevisions[documentRevisions.length - 1]);
        } catch (error) {
          handleApiError({ error, logger, t });
          throw error;
        }
      }
    );
  };

  const hardDeleteSection = async ({ section, reason, deleteAllRevisions }) => {
    const documentId = doc._id;
    const sectionKey = section.key;
    const sectionRevision = section.revision;

    try {
      const { document: updatedDoc } = await documentApiClient.hardDeleteSection({ documentId, sectionKey, sectionRevision, reason, deleteAllRevisions });

      setDoc(updatedDoc);
      setCurrentSections(updatedDoc.sections);
    } catch (error) {
      handleApiError({ error, logger, t });
    }

    const { documentRevisions } = await documentApiClient.getDocumentRevisions(documentId);

    setHistoryRevisions(documentRevisions);
    setSelectedHistoryRevision(documentRevisions[documentRevisions.length - 1]);
  };

  const handleSectionHardDelete = index => {
    confirmSectionHardDelete(
      t,
      async ({ reason, deleteAllRevisions }) => {
        const section = selectedHistoryRevision.sections[index];
        await hardDeleteSection({ section, reason, deleteAllRevisions });
      }
    );
  };

  const handleCommentPostClick = async ({ topic, text }) => {
    try {
      await commentApiClient.addComment({ documentId: doc._id, topic, text });
      await fetchComments();
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleCommentsTopicChangeClick = async ({ oldTopic, newTopic }) => {
    try {
      await commentApiClient.updateCommentsTopic({ oldTopic, newTopic });
      await fetchComments();
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleCommentDeleteClick = async commentId => {
    try {
      await commentApiClient.deleteComment({ commentId });
      await fetchComments();
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  let controlStatus;
  if (invalidSectionKeys.length) {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.invalid;
  } else if (isDirty) {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.dirty;
  } else {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.saved;
  }

  const showHistoryPanel = view === VIEW.display || view === VIEW.history;
  const showCommentsPanel = view === VIEW.display || view === VIEW.comments;
  const showEditPanel = userCanEditDocContent && (view === VIEW.display || view === VIEW.edit);

  return (
    <Fragment>
      <PageTemplate alerts={alerts}>
        <div className="DocPage">
          {room && (
            <Breadcrumb className="Breadcrumbs">
              <Breadcrumb.Item href={routes.getDashboardUrl({ tab: 'rooms' })}>{t('common:roomsBreadcrumbPart')}</Breadcrumb.Item>
              <Breadcrumb.Item href={routes.getRoomUrl(room._id, room.slug)}>{room.name}</Breadcrumb.Item>
              <Breadcrumb.Item>{doc.title}</Breadcrumb.Item>
            </Breadcrumb>
          )}
          <div className="DocPage-badges">
            {!!doc.publicContext?.verified && (
              <Tooltip title={t('common:verifiedDocumentBadge')}>
                <LikeOutlined className="u-verified-badge" />
              </Tooltip>
            )}
            {!!doc.publicContext?.allowedOpenContribution && (
              <Tooltip title={t(`common:allowedOpenContributionBadge_${doc.publicContext.allowedOpenContribution}`)}>
                <div className="u-allowed-open-contribution-badge">
                  {doc.publicContext.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none
                    && <AllowedOpenContributionNoneIcon />}
                  {doc.publicContext.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content
                    && <AllowedOpenContributionContentIcon />}
                  {doc.publicContext.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent
                    && <AllowedOpenContributionMetadataAndContentIcon />}
                </div>
              </Tooltip>
            )}
            <FavoriteStar className="DocPage-verifiedBadge" type={FAVORITE_TYPE.document} id={doc._id} />
          </div>
          <SectionsDisplay
            sections={view === VIEW.history ? selectedHistoryRevision?.sections || [] : currentSections}
            pendingSectionKeys={pendingTemplateSectionKeys}
            editedSectionKeys={editedSectionKeys}
            canEdit={view === VIEW.edit}
            canHardDelete={userCanHardDelete && view === VIEW.history}
            onPendingSectionApply={handlePendingSectionApply}
            onPendingSectionDiscard={handlePendingSectionDiscard}
            onSectionContentChange={handleSectionContentChange}
            onSectionCopyToClipboard={handleSectionCopyToClipboard}
            onSectionPasteFromClipboard={handleSectionPasteFromClipboard}
            onSectionMove={handleSectionMove}
            onSectionInsert={handleSectionInsert}
            onSectionDuplicate={handleSectionDuplicate}
            onSectionDelete={handleSectionDelete}
            onSectionHardDelete={handleSectionHardDelete}
            onSectionEditEnter={handleSectionEditEnter}
            onSectionEditLeave={handleSectionEditLeave}
            />
          <CreditsFooter doc={selectedHistoryRevision ? null : doc} revision={selectedHistoryRevision} />

          {view === VIEW.comments && (
            <section ref={commentsSectionRef} className="DocPage-commentsSection">
              <div className="DocPage-commentsSectionHeader">{t('commentsHeader')}</div>
              <CommentsPanel
                comments={comments}
                onCommentPostClick={handleCommentPostClick}
                onCommentDeleteClick={handleCommentDeleteClick}
                onTopicChangeClick={handleCommentsTopicChangeClick}
                />
            </section>
          )}
        </div>
      </PageTemplate>
      <div className={classNames('DocPage-controlPanels', { 'is-panel-open': view !== VIEW.display })}>
        {showHistoryPanel && (
          <Restricted to={permissions.EDIT_DOC}>
            <div className={classNames('DocPage-controlPanelsItem', { 'is-open': view === VIEW.history })}>
              <HistoryControlPanel
                revisions={historyRevisions}
                selectedRevisionIndex={historyRevisions.indexOf(selectedHistoryRevision)}
                startOpen={initialView === VIEW.history}
                onOpen={handleHistoryOpen}
                onClose={handleHistoryClose}
                canRestoreRevisions={userCanEditDocContent}
                onPermalinkRequest={handlePermalinkRequest}
                onSelectedRevisionChange={handleSelectedRevisionChange}
                onRestoreRevision={handleRestoreRevision}
                />
            </div>
          </Restricted>
        )}
        {showCommentsPanel && (
          <div className={classNames('DocPage-controlPanelsItem', { 'is-open': view === VIEW.comments })}>
            <ControlPanel
              startOpen={initialView === VIEW.comments}
              openIcon={<CommentsIcon />}
              onOpen={handleCommentsOpen}
              onClose={handleCommentsClose}
              leftSideContent={
                <div>{t('commentsPanelTitle')}</div>
              }
              />
          </div>
        )}
        {showEditPanel && (
          <Restricted to={permissions.EDIT_DOC}>
            <div className={classNames('DocPage-controlPanelsItem', { 'is-open': view === VIEW.edit })}>
              <EditControlPanel
                canEditMetadata={userCanEditDocMetadata}
                startOpen={initialView === VIEW.edit}
                onOpen={handleEditOpen}
                onMetadataOpen={handleEditMetadataOpen}
                onSave={handleEditSave}
                onClose={handleEditClose}
                status={controlStatus}
                />
            </div>
          </Restricted>
        )}
      </div>

      <DocumentMetadataModal
        allowMultiple={false}
        initialDocumentMetadata={doc}
        initialDocumentRoomMetadata={room}
        isVisible={isDocumentMetadataModalVisible}
        mode={DOCUMENT_METADATA_MODAL_MODE.update}
        onSave={handleDocumentMetadataModalSave}
        onClose={handleDocumentMetadataModalClose}
        />
    </Fragment>
  );
}

Doc.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    doc: documentShape.isRequired,
    templateSections: PropTypes.arrayOf(sectionShape),
    room: roomShape
  }).isRequired
};

export default Doc;
