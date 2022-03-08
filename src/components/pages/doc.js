import { message } from 'antd';
import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Restricted from '../restricted.js';
import clipboardCopy from 'clipboard-copy';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import uniqueId from '../../utils/unique-id.js';
import MetadataTitle from '../metadata-title.js';
import CreditsFooter from '../credits-footer.js';
import cloneDeep from '../../utils/clone-deep.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import SectionsDisplay from '../sections-display.js';
import { Trans, useTranslation } from 'react-i18next';
import InfoFactory from '../../plugins/info-factory.js';
import { handleApiError } from '../../ui/error-helper.js';
import EditorFactory from '../../plugins/editor-factory.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import React, { Fragment, useEffect, useState } from 'react';
import HistoryControlPanel from '../history-control-panel.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import { documentShape, sectionShape } from '../../ui/default-prop-types.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { DOCUMENT_ORIGIN, DOC_VIEW_QUERY_PARAM, FAVORITE_TYPE } from '../../domain/constants.js';
import EditControlPanel, { EDIT_CONTROL_PANEL_STATUS } from '../edit-control-panel.js';
import DocumentMetadataModal, { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal.js';
import { ensureIsExcluded, ensureIsIncluded, insertItemAt, moveItem, removeItemAt, replaceItemAt } from '../../utils/array-utils.js';
import {
  confirmDiscardUnsavedChanges,
  confirmDocumentRevisionRestoration,
  confirmSectionDelete,
  confirmSectionHardDelete
} from '../confirmation-dialogs.js';
import FavoriteStar from '../favorite-star.js';

const logger = new Logger(import.meta.url);

const ensureEditorsAreLoaded = memoizee(editorFactory => editorFactory.ensureEditorsAreLoaded());

const VIEW = {
  display: 'display',
  edit: DOC_VIEW_QUERY_PARAM.edit,
  history: DOC_VIEW_QUERY_PARAM.history
};

function Doc({ initialState, PageTemplate }) {
  const user = useUser();
  const request = useRequest();
  const { t } = useTranslation('doc');
  const globalAlerts = useGlobalAlerts();
  const [alerts, setAlerts] = useState([]);
  const infoFactory = useService(InfoFactory);
  const editorFactory = useService(EditorFactory);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const isExternalDocument = initialState.doc.origin.startsWith(DOCUMENT_ORIGIN.external);
  const initialView = Object.values(VIEW).find(v => v === request.query.view) || VIEW.display;

  const isEditViewAllowed = !isExternalDocument && !initialState.doc.archived;
  const isHardDeletionAllowed = hasUserPermission(user, permissions.HARD_DELETE_SECTION);

  const [isDirty, setIsDirty] = useState(false);
  const [doc, setDoc] = useState(initialState.doc);
  const [historyRevisions, setHistoryRevisions] = useState([]);
  const [invalidSectionKeys, setInvalidSectionKeys] = useState([]);
  const [view, setView] = useState(user ? initialView : VIEW.display);
  const [selectedHistoryRevision, setSelectedHistoryRevision] = useState(null);
  const [isDocumentMetadataModalVisible, setIsDocumentMetadataModalVisible] = useState(false);
  const [pendingTemplateSectionKeys, setPendingTemplateSectionKeys] = useState((initialState.templateSections || []).map(s => s.key));
  const [currentSections, setCurrentSections] = useState(cloneDeep(initialState.templateSections?.length ? initialState.templateSections : doc.sections));

  useEffect(() => {
    const newAlerts = [...globalAlerts];

    if (doc.archived) {
      newAlerts.push({
        message: t('common:archivedAlert')
      });
    }

    if (isExternalDocument) {
      newAlerts.push({
        message:
          (<Trans
            t={t}
            i18nKey="common:externalDocumentWarning"
            components={[<a key="external-document-warning" href={doc.originUrl} />]}
            />)
      });
    }

    if (view === VIEW.edit && pendingTemplateSectionKeys?.length) {
      newAlerts.push({
        message: t('proposedSectionsAlert')
      });
    }

    setAlerts(newAlerts);
  }, [globalAlerts, doc, view, isExternalDocument, pendingTemplateSectionKeys, t]);

  useEffect(() => {
    if (initialView === VIEW.edit || view === VIEW.edit) {
      ensureEditorsAreLoaded(editorFactory);
    }

    if (initialView === VIEW.history) {
      (async () => {
        try {
          const { documentRevisions } = await documentApiClient.getDocumentRevisions(doc.key);
          setHistoryRevisions(documentRevisions);
          setSelectedHistoryRevision(documentRevisions[documentRevisions.length - 1]);
        } catch (error) {
          handleApiError({ error, t, logger });
        }
      })();
    }
  }, [initialView, doc.key, view, t, editorFactory, documentApiClient]);

  useEffect(() => {
    switch (view) {
      case VIEW.display:
        history.replaceState(null, '', urls.getDocUrl({ key: doc.key, slug: doc.slug }));
        break;
      case VIEW.edit:
        history.replaceState(null, '', urls.getDocUrl({ key: doc.key, slug: doc.slug, view: VIEW.edit }));
        break;
      case VIEW.history:
        history.replaceState(null, '', urls.getDocUrl({ key: doc.key, slug: doc.slug, view: VIEW.history }));
        break;
      default:
        break;
    }
  }, [user, doc.key, doc.slug, view]);

  const handleEditMetadataOpen = () => {
    setIsDocumentMetadataModalVisible(true);
  };

  const handleDocumentMetadataModalSave = async ({ templateDocumentKey, ...newMetadata }) => {
    const updatedDoc = await documentApiClient.updateDocumentMetadata({ documentKey: doc.key, metadata: newMetadata });

    setDoc(updatedDoc);
    setIsDocumentMetadataModalVisible(false);
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
      const updatedDoc = await documentApiClient.updateDocumentSections({ documentKey: doc.key, sections: newSections });

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
        setPendingTemplateSectionKeys([]);
        setCurrentSections(doc.sections);

        setIsDirty(false);
        setView(VIEW.display);
        setInvalidSectionKeys([]);
        resolve(true);
      };

      if (isDirty) {
        confirmDiscardUnsavedChanges(t, exitEditMode, () => resolve(false));
      } else {
        exitEditMode();
      }
    });
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
    const pluginInfo = infoFactory.createInfo(pluginType);
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

  const handleSectionDelete = index => {
    confirmSectionDelete(
      t,
      () => {
        const section = currentSections[index];
        const reducedSections = removeItemAt(currentSections, index);
        setInvalidSectionKeys(keys => ensureIsExcluded(keys, section.key));
        setCurrentSections(reducedSections);
        setIsDirty(true);
      }
    );
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
      const { documentRevisions } = await documentApiClient.getDocumentRevisions(doc.key);
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
    const permalinkUrl = urls.createFullyQualifiedUrl(urls.getDocumentRevisionUrl(selectedHistoryRevision._id));
    try {
      await clipboardCopy(permalinkUrl);
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
          const { documentRevisions } = await documentApiClient.restoreDocumentRevision({
            documentKey: selectedHistoryRevision.key,
            revisionId: selectedHistoryRevision._id
          });

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
    const documentKey = doc.key;
    const sectionKey = section.key;
    const sectionRevision = section.revision;

    try {
      await documentApiClient.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions });
    } catch (error) {
      handleApiError({ error, logger, t });
    }

    const { documentRevisions } = await documentApiClient.getDocumentRevisions(documentKey);

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

  let controlStatus;
  if (invalidSectionKeys.length) {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.invalid;
  } else if (isDirty) {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.dirty;
  } else {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.saved;
  }

  const publicStorage = {
    rootPath: 'media',
    initialPath: `media/${doc.key}`,
    uploadPath: `media/${doc.key}`
  };

  return (
    <Fragment>
      <PageTemplate alerts={alerts}>
        <div className="DocPage">
          <MetadataTitle
            text={selectedHistoryRevision ? selectedHistoryRevision.title : doc.title}
            extra={<FavoriteStar type={FAVORITE_TYPE.document} id={doc.key} />}
            />
          <SectionsDisplay
            sections={view === VIEW.history ? selectedHistoryRevision?.sections || [] : currentSections}
            pendingSectionKeys={pendingTemplateSectionKeys}
            publicStorage={publicStorage}
            canEdit={view === VIEW.edit}
            canHardDelete={isHardDeletionAllowed && view === VIEW.history}
            onPendingSectionApply={handlePendingSectionApply}
            onPendingSectionDiscard={handlePendingSectionDiscard}
            onSectionContentChange={handleSectionContentChange}
            onSectionMove={handleSectionMove}
            onSectionInsert={handleSectionInsert}
            onSectionDuplicate={handleSectionDuplicate}
            onSectionDelete={handleSectionDelete}
            onSectionHardDelete={handleSectionHardDelete}
            />
          <CreditsFooter doc={selectedHistoryRevision ? null : doc} revision={selectedHistoryRevision} />
        </div>
      </PageTemplate>
      <Restricted to={permissions.EDIT_DOC}>
        <HistoryControlPanel
          revisions={historyRevisions}
          selectedRevisionIndex={historyRevisions.indexOf(selectedHistoryRevision)}
          startOpen={initialView === VIEW.history}
          onOpen={handleHistoryOpen}
          onClose={handleHistoryClose}
          canRestoreRevisions={!isExternalDocument}
          onPermalinkRequest={handlePermalinkRequest}
          onSelectedRevisionChange={handleSelectedRevisionChange}
          onRestoreRevision={handleRestoreRevision}
          />
        {isEditViewAllowed && (
          <EditControlPanel
            canClose
            canCancel={false}
            startOpen={initialView === VIEW.edit}
            onOpen={handleEditOpen}
            onMetadataOpen={handleEditMetadataOpen}
            onSave={handleEditSave}
            onClose={handleEditClose}
            status={controlStatus}
            metadata={(
              <span className="DocPage-editControlPanelItem">{doc.title}</span>
            )}
            />
        )}
      </Restricted>

      <DocumentMetadataModal
        initialDocumentMetadata={doc}
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
    templateSections: PropTypes.arrayOf(sectionShape)
  }).isRequired
};

export default Doc;
