import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import FavoriteStar from '../favorite-star.js';
import ControlPanel from '../control-panel.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import uniqueId from '../../utils/unique-id.js';
import { ALERT_TYPE } from '../custom-alert.js';
import CreditsFooter from '../credits-footer.js';
import { LikeOutlined } from '@ant-design/icons';
import { useIsMounted } from '../../ui/hooks.js';
import cloneDeep from '../../utils/clone-deep.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import SectionsDisplay from '../sections-display.js';
import EditControlPanel from '../edit-control-panel.js';
import { Breadcrumb, Button, message, Tooltip } from 'antd';
import PluginRegistry from '../../plugins/plugin-registry.js';
import HistoryControlPanel from '../history-control-panel.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import CommentsIcon from '../icons/multi-color/comments-icon.js';
import DocumentCommentsPanel from '../document-comments-panel.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { RoomMediaContextProvider } from '../room-media-context.js';
import { handleApiError, handleError } from '../../ui/error-helper.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { DOC_VIEW_QUERY_PARAM, FAVORITE_TYPE } from '../../domain/constants.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import { isTouchDevice, supportsClipboardPaste } from '../../ui/browser-helper.js';
import DocumentCommentApiClient from '../../api-clients/document-comment-api-client.js';
import { ensurePluginComponentAreLoadedForSections } from '../../utils/plugin-utils.js';
import { documentShape, roomMediaContextShape, roomShape, sectionShape } from '../../ui/default-prop-types.js';
import { ensureIsExcluded, ensureIsIncluded, insertItemAt, moveItem, removeItemAt, replaceItemAt } from '../../utils/array-utils.js';
import { createClipboardTextForSection, createNewSectionFromClipboardText, redactSectionContent } from '../../services/section-helper.js';
import {
  confirmDiscardUnsavedChanges,
  confirmDocumentRevisionRestoration,
  confirmSectionDelete,
  confirmSectionHardDelete
} from '../confirmation-dialogs.js';
import {
  canEditDocument,
  findCurrentlyWorkedOnSectionKey,
  getEditDocRestrictionTooltip,
  tryBringSectionIntoView
} from '../../utils/document-utils.js';

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

  if (view === VIEW.edit && hasPendingTemplateSectionKeys) {
    alerts.push({ message: t('common:proposedSectionsAlert') });
  }

  if (review) {
    alerts.push({ message: review, type: ALERT_TYPE.warning });
  }

  return alerts;
}

function getDocumentMetadataModalState({ t, doc, room, isCloning, isOpen = false }) {
  return {
    isOpen,
    mode: isCloning ? DOCUMENT_METADATA_MODAL_MODE.clone : DOCUMENT_METADATA_MODAL_MODE.update,
    documentToClone: isCloning ? doc : null,
    allowMultiple: false,
    initialDocumentRoomMetadata: room ? { ...room } : null,
    initialDocumentMetadata: isCloning
      ? {
        ...doc,
        title: `${doc.title} ${t('common:copyTitleSuffix')}`,
        slug: doc.slug ? `${doc.slug}-${t('common:copySlugSuffix')}` : '',
        tags: [...doc.tags]
      }
      : { ...doc }
  };
}

const determineInitialViewState = request => {
  const requestView = Object.values(VIEW).find(v => v === request.query.view);
  if (!requestView) {
    return { preSetView: null, view: VIEW.display };
  }

  return { preSetView: requestView, view: requestView };
};

class DocPreloader {
  static dependencies = [PluginRegistry];

  constructor(pluginRegistry) {
    this.pluginRegistry = pluginRegistry;
  }

  preload({ initialState, request }) {
    const startsInEditMode = determineInitialViewState(request).view === VIEW.edit;
    return ensurePluginComponentAreLoadedForSections({
      sections: [...initialState.doc.sections, ...initialState.templateSections],
      pluginRegistry: this.pluginRegistry,
      displayOnly: !startsInEditMode
    });
  }
}

function Doc({ initialState, PageTemplate }) {
  const user = useUser();
  const pageRef = useRef(null);
  const request = useRequest();
  const isMounted = useIsMounted();
  const { t } = useTranslation('doc');
  const controlPanelsRef = useRef(null);
  const documentCommentsSectionRef = useRef(null);
  const pluginRegistry = useService(PluginRegistry);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);
  const documentCommentApiClient = useSessionAwareApiClient(DocumentCommentApiClient);

  const { room } = initialState;

  const userCanHardDelete = hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT);
  const userCanEdit = hasUserPermission(user, permissions.CREATE_CONTENT);
  const userCanEditDocument = canEditDocument({ user, doc: initialState.doc, room });
  const editDocRestrictionTooltip = getEditDocRestrictionTooltip({ t, user, doc: initialState.doc, room });

  const [isDirty, setIsDirty] = useState(false);
  const [doc, setDoc] = useState(initialState.doc);
  const [lastViewInfo, setLastViewInfo] = useState(null);
  const [documentComments, setDocumentComments] = useState([]);
  const [historyRevisions, setHistoryRevisions] = useState([]);
  const [editedSectionKeys, setEditedSectionKeys] = useState([]);
  const [controPanelTopInPx, setControlPanelTopInPx] = useState(null);
  const [view, setView] = useState(determineInitialViewState(request).view);
  const [selectedHistoryRevision, setSelectedHistoryRevision] = useState(null);
  const [controlPanelMarginRightInPx, setControlPanelMarginRightInPx] = useState(0);
  const [preSetView, setPreSetView] = useState(determineInitialViewState(request).preSetView);
  const [areDocumentCommentsInitiallyLoaded, setAreDocumentCommentsInitiallyLoaded] = useState(false);
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ t }));
  const [pendingTemplateSectionKeys, setPendingTemplateSectionKeys] = useState((initialState.templateSections || []).map(s => s.key));
  const [currentSections, setCurrentSections] = useState(cloneDeep(initialState.templateSections?.length ? initialState.templateSections : doc.sections));

  const ensureControlPanelPosition = useCallback(() => {
    const isControlPanelOpen = view !== VIEW.display;

    if (isTouchDevice()) {
      const windowHeight = Math.min(window.innerHeight, window.outerHeight);
      setControlPanelTopInPx(windowHeight - controlPanelsRef.current.getBoundingClientRect().height);
    }

    if (isControlPanelOpen) {
      const windowWidth = Math.min(window.innerWidth, window.outerWidth);
      const pageWidth = pageRef.current.getBoundingClientRect().width;
      setControlPanelMarginRightInPx(-(windowWidth - pageWidth) / 2);
    } else {
      setControlPanelMarginRightInPx(0);
    }
  }, [controlPanelsRef, view]);

  useEffect(() => {
    ensureControlPanelPosition();

    // Ensure panel stays on the bottom when address bar is hidden on mobile
    window.addEventListener('resize', ensureControlPanelPosition);

    return () => {
      window.removeEventListener('resize', ensureControlPanelPosition);
    };
  }, [ensureControlPanelPosition]);

  const [alerts, setAlerts] = useState(createPageAlerts({
    t,
    doc,
    view,
    hasPendingTemplateSectionKeys: !!pendingTemplateSectionKeys.length
  }));

  const switchView = newView => {
    setLastViewInfo({ view, sectionKeyToScrollTo: findCurrentlyWorkedOnSectionKey() });
    setPreSetView(null);
    setView(newView);
  };

  useEffect(() => {
    if (view !== VIEW.comments && lastViewInfo?.view !== VIEW.comments && lastViewInfo?.sectionKeyToScrollTo) {
      setTimeout(() => tryBringSectionIntoView(lastViewInfo.sectionKeyToScrollTo), 500);
    }

    if (view === VIEW.comments && !!documentCommentsSectionRef.current) {
      documentCommentsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [view, lastViewInfo, documentCommentsSectionRef]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await documentCommentApiClient.getAllDocumentComments({ documentId: doc._id });
      setAreDocumentCommentsInitiallyLoaded(true);
      setDocumentComments(response.documentComments);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  }, [doc, documentCommentApiClient, t]);

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
    if (preSetView === VIEW.history) {
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

    if (preSetView === VIEW.comments) {
      (async () => {
        await fetchComments();
      })();
    }
  }, [preSetView, doc._id, view, t, documentApiClient, fetchComments]);

  useEffect(() => {
    const viewQueryValue = view === VIEW.display ? null : view;
    history.replaceState(null, '', routes.getDocUrl({ id: doc._id, slug: doc.slug, view: viewQueryValue }));
  }, [user, doc._id, doc.slug, view]);

  const handleEditMetadataOpen = () => {
    setDocumentMetadataModalState(getDocumentMetadataModalState({ t, doc, room, isCloning: false, isOpen: true }));
  };

  const handleDocumentCloneClick = () => {
    setDocumentMetadataModalState(getDocumentMetadataModalState({ t, doc, room, isCloning: true, isOpen: true }));
  };

  const handleDocumentMetadataModalSave = updatedDocuments => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));

    if (documentMetadataModalState.mode === DOCUMENT_METADATA_MODAL_MODE.update) {
      setDoc(updatedDocuments[0]);
      message.success(t('common:changesSavedSuccessfully'));
    }

    if (documentMetadataModalState.mode === DOCUMENT_METADATA_MODAL_MODE.clone) {
      window.location = routes.getDocUrl({
        id: updatedDocuments[0]._id,
        slug: updatedDocuments[0].slug,
        view: DOC_VIEW_QUERY_PARAM.edit,
        templateDocumentId: doc._id
      });
    }
  };

  const handleDocumentMetadataModalClose = () => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleEditOpen = () => {
    switchView(VIEW.edit);
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
      message.success(t('common:changesSavedSuccessfully'));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleEditClose = () => {
    return new Promise(resolve => {
      const exitEditMode = () => {
        setCurrentSections(doc.sections);
        setIsDirty(false);
        switchView(VIEW.display);
        setEditedSectionKeys([]);
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

  const handleDocumentCommentsOpen = async () => {
    setAreDocumentCommentsInitiallyLoaded(false);
    switchView(VIEW.comments);
    await fetchComments();
  };

  const handleDocumentCommentsClose = () => {
    switchView(VIEW.display);
    setDocumentComments([]);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    return true;
  };

  const handleHistoryOpen = async () => {
    try {
      const { documentRevisions } = await documentApiClient.getDocumentRevisions(doc._id);
      setHistoryRevisions(documentRevisions);
      setSelectedHistoryRevision(documentRevisions[documentRevisions.length - 1]);
      switchView(VIEW.history);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleHistoryClose = () => {
    setHistoryRevisions([]);
    setSelectedHistoryRevision(null);
    switchView(VIEW.display);
    return true;
  };

  const handleSectionContentChange = useCallback((index, newContent) => {
    const modifiedSection = {
      ...currentSections[index],
      content: newContent
    };

    const newSections = replaceItemAt(currentSections, modifiedSection, index);
    setCurrentSections(newSections);
    setIsDirty(true);
  }, [currentSections]);

  const handleSectionMove = useCallback((sourceIndex, destinationIndex) => {
    const reorderedSections = moveItem(currentSections, sourceIndex, destinationIndex);
    setCurrentSections(reorderedSections);
    setIsDirty(true);
  }, [currentSections]);

  const handleSectionInsert = useCallback((pluginType, index) => {
    const plugin = pluginRegistry.getRegisteredPlugin(pluginType);
    const newSection = {
      key: uniqueId.create(),
      type: plugin.name,
      content: plugin.info.getDefaultContent(t)
    };
    const newSections = insertItemAt(currentSections, newSection, index);
    setCurrentSections(newSections);
    setEditedSectionKeys(keys => ensureIsIncluded(keys, newSection.key));
    setIsDirty(true);
  }, [currentSections, pluginRegistry, t]);

  const handleSectionDuplicate = useCallback(index => {
    const originalSection = currentSections[index];
    const duplicatedSection = cloneDeep(originalSection);
    duplicatedSection.key = uniqueId.create();

    const expandedSections = insertItemAt(currentSections, duplicatedSection, index + 1);
    setCurrentSections(expandedSections);
    setIsDirty(true);
    setEditedSectionKeys(keys => ensureIsIncluded(keys, duplicatedSection.key));
  }, [currentSections]);

  const handleSectionCopyToClipboard = useCallback(async index => {
    const originalSection = currentSections[index];
    const clipboardText = createClipboardTextForSection(originalSection, request.hostInfo.origin);
    try {
      await window.navigator.clipboard.writeText(clipboardText);
      message.success(t('common:sectionCopiedToClipboard'));
    } catch (error) {
      handleError({ message: t('common:copySectionToClipboardError'), error, logger, t, duration: 30 });
    }
  }, [currentSections, request, t]);

  const handleSectionPasteFromClipboard = useCallback(async index => {
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
  }, [currentSections, pluginRegistry, request, room, t]);

  const handleSectionDelete = useCallback(index => {
    confirmSectionDelete(
      t,
      () => {
        const section = currentSections[index];
        const reducedSections = removeItemAt(currentSections, index);
        setEditedSectionKeys(keys => ensureIsExcluded(keys, section.key));
        setCurrentSections(reducedSections);
        setIsDirty(true);
      }
    );
  }, [currentSections, t]);

  const handleSectionEditEnter = useCallback(index => {
    const section = currentSections[index];
    setEditedSectionKeys(keys => ensureIsIncluded(keys, section.key));
  }, [currentSections]);

  const handleSectionEditLeave = useCallback(index => {
    const section = currentSections[index];
    setEditedSectionKeys(keys => ensureIsExcluded(keys, section.key));
  }, [currentSections]);

  const handlePendingSectionApply = useCallback(index => {
    const appliedSectionKey = currentSections[index].key;
    setPendingTemplateSectionKeys(prevKeys => ensureIsExcluded(prevKeys, appliedSectionKey));
    setIsDirty(true);
  }, [currentSections]);

  const handlePendingSectionDiscard = useCallback(index => {
    const discardedSection = currentSections[index];
    setCurrentSections(prevSections => ensureIsExcluded(prevSections, discardedSection));
    setIsDirty(true);
  }, [currentSections]);

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

  const hardDeleteSection = useCallback(async ({ section, reason, deleteAllRevisions }) => {
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
  }, [doc, documentApiClient, t]);

  const handleSectionHardDelete = useCallback(index => {
    confirmSectionHardDelete(
      t,
      async ({ reason, deleteAllRevisions }) => {
        const section = selectedHistoryRevision.sections[index];
        await hardDeleteSection({ section, reason, deleteAllRevisions });
      }
    );
  }, [hardDeleteSection, selectedHistoryRevision, t]);

  const handleDocumentCommentPostClick = async ({ topic, text }) => {
    try {
      await documentCommentApiClient.addDocumentComment({ documentId: doc._id, topic, text });
      await fetchComments();
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleDocumentCommentsTopicChangeClick = async ({ oldTopic, newTopic }) => {
    try {
      await documentCommentApiClient.updateDocumentCommentsTopic({ documentId: doc._id, oldTopic, newTopic });
      await fetchComments();
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleDocumentCommentDeleteClick = async documentCommentId => {
    try {
      await documentCommentApiClient.deleteDocumentComment({ documentCommentId });
      await fetchComments();
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const showHistoryPanel = !!isMounted.current && (view === VIEW.display || view === VIEW.history);
  const showCommentsPanel = !!isMounted.current && (view === VIEW.display || view === VIEW.comments);
  const showEditPanel = !!isMounted.current && (view === VIEW.display || view === VIEW.edit);

  const controlPanelStyle = {};
  if (controPanelTopInPx !== null) {
    controlPanelStyle.top = `${controPanelTopInPx}px`;
  }
  if (controlPanelMarginRightInPx !== null) {
    controlPanelStyle.marginRight = `${controlPanelMarginRightInPx}px`;
  }

  return (
    <RoomMediaContextProvider context={initialState.roomMediaContext}>
      <PageTemplate alerts={alerts}>
        <div className="DocPage" ref={pageRef}>
          {!!room && (
            <Breadcrumb className="Breadcrumbs">
              <Breadcrumb.Item href={routes.getDashboardUrl({ tab: 'rooms' })}>{t('common:roomsBreadcrumbPart')}</Breadcrumb.Item>
              <Breadcrumb.Item href={routes.getRoomUrl(room._id, room.slug)}>{room.name}</Breadcrumb.Item>
              <Breadcrumb.Item>{doc.title}</Breadcrumb.Item>
            </Breadcrumb>
          )}
          <div className="DocPage-badges">
            {!!userCanEdit && (
              <Tooltip title={t('duplicateDocument')}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<DuplicateIcon />}
                  className="DocPage-cloneButton"
                  onClick={() => handleDocumentCloneClick()}
                  />
              </Tooltip>
            )}
            {!!doc.publicContext?.verified && (
              <Tooltip title={t('common:verifiedDocumentBadge')}>
                <LikeOutlined className="u-large-badge" />
              </Tooltip>
            )}
            <FavoriteStar className="DocPage-badge" type={FAVORITE_TYPE.document} id={doc._id} />
          </div>
          <SectionsDisplay
            sections={view === VIEW.history ? selectedHistoryRevision?.sections || [] : currentSections}
            pendingSectionKeys={pendingTemplateSectionKeys}
            editedSectionKeys={editedSectionKeys}
            canEdit={view === VIEW.edit}
            canHardDelete={!!userCanHardDelete && view === VIEW.history}
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

          {view === VIEW.comments && !!isMounted.current && (
            <section ref={documentCommentsSectionRef} className="DocPage-commentsSection">
              <div className="DocPage-commentsSectionHeader">{t('commentsHeader')}</div>
              <DocumentCommentsPanel
                documentComments={documentComments}
                isLoading={!areDocumentCommentsInitiallyLoaded}
                onDocumentCommentPostClick={handleDocumentCommentPostClick}
                onDocumentCommentDeleteClick={handleDocumentCommentDeleteClick}
                onTopicChangeClick={handleDocumentCommentsTopicChangeClick}
                />
            </section>
          )}
        </div>
        <div ref={controlPanelsRef} style={controlPanelStyle} className="DocPage-controlPanels" >
          {!!showHistoryPanel && (
            <div className={classNames('DocPage-controlPanelsItem', { 'is-open': view === VIEW.history })}>
              <HistoryControlPanel
                revisions={historyRevisions}
                selectedRevisionIndex={historyRevisions.indexOf(selectedHistoryRevision)}
                canRestoreRevisions={userCanEditDocument}
                startOpen={preSetView === VIEW.history}
                onOpen={handleHistoryOpen}
                onClose={handleHistoryClose}
                onPermalinkRequest={handlePermalinkRequest}
                onSelectedRevisionChange={handleSelectedRevisionChange}
                onRestoreRevision={handleRestoreRevision}
                />
            </div>
          )}
          {!!showCommentsPanel && (
          <div className={classNames('DocPage-controlPanelsItem', { 'is-open': view === VIEW.comments })}>
            <ControlPanel
              startOpen={preSetView === VIEW.comments}
              openIcon={<CommentsIcon />}
              onOpen={handleDocumentCommentsOpen}
              onClose={handleDocumentCommentsClose}
              leftSideContent={<div>{t('commentsPanelTitle')}</div>}
              tooltipWhenClosed={t('commentsControlPanelTooltip')}
              />
          </div>
          )}
          {!!showEditPanel && (
            <div className={classNames('DocPage-controlPanelsItem', { 'is-open': view === VIEW.edit })}>
              <EditControlPanel
                isDirtyState={isDirty}
                startOpen={preSetView === VIEW.edit}
                disabled={!userCanEdit || !userCanEditDocument}
                tooltipWhenDisabled={editDocRestrictionTooltip}
                onOpen={handleEditOpen}
                onMetadataOpen={handleEditMetadataOpen}
                onSave={handleEditSave}
                onClose={handleEditClose}
                />
            </div>
          )}
        </div>
      </PageTemplate>

      <DocumentMetadataModal
        {...documentMetadataModalState}
        onSave={handleDocumentMetadataModalSave}
        onClose={handleDocumentMetadataModalClose}
        />
    </RoomMediaContextProvider>
  );
}

Doc.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    doc: documentShape.isRequired,
    templateSections: PropTypes.arrayOf(sectionShape),
    room: roomShape,
    roomMediaContext: roomMediaContextShape
  }).isRequired
};

Doc.clientPreloader = DocPreloader;

export default Doc;
