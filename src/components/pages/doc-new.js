import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Restricted from '../restricted.js';
import Logger from '../../common/logger.js';
import uniqueId from '../../utils/unique-id.js';
import CreditsFooter from '../credits-footer.js';
import cloneDeep from '../../utils/clone-deep.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import permissions from '../../domain/permissions.js';
import { Trans, useTranslation } from 'react-i18next';
import InfoFactory from '../../plugins/info-factory.js';
import { handleApiError } from '../../ui/error-helper.js';
import EditorFactory from '../../plugins/editor-factory.js';
import SectionsDisplayNew from '../sections-display-new.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import React, { Fragment, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import EditControlPanel, { EDIT_CONTROL_PANEL_STATUS } from '../edit-control-panel.js';
import { confirmDiscardUnsavedChanges, confirmSectionDelete } from '../confirmation-dialogs.js';
import { ALERT_TYPE, DOCUMENT_TYPE, DOCUMENT_ORIGIN, DOC_VIEW } from '../../domain/constants.js';
import { documentRevisionShape, documentShape, sectionShape } from '../../ui/default-prop-types.js';
import DocumentMetadataModal, { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal.js';
import { ensureIsExcluded, ensureIsIncluded, insertItemAt, moveItem, removeItemAt, replaceItemAt } from '../../utils/array-utils.js';

const logger = new Logger(import.meta.url);

const ensureEditorsAreLoaded = memoizee(editorFactory => editorFactory.ensureEditorsAreLoaded());

function Doc({ initialState, PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('docNew');
  const globalAlerts = useGlobalAlerts();
  const [alerts, setAlerts] = useState([]);
  const infoFactory = useService(InfoFactory);
  const editorFactory = useService(EditorFactory);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const startsInEditMode = request.query.view === DOC_VIEW.edit;

  const [isDirty, setIsDirty] = useState(false);
  const [doc, setDoc] = useState(initialState.doc);
  const [isInEditMode, setIsInEditMode] = useState(startsInEditMode);
  const [invalidSectionKeys, setInvalidSectionKeys] = useState([]);
  const [latestRevision, setLatestRevision] = useState(initialState.latestRevision);
  const [isDocumentMetadataModalVisible, setIsDocumentMetadataModalVisible] = useState(false);
  const [pendingTemplateSectionKeys, setPendingTemplateSectionKeys] = useState((initialState.templateSections || []).map(s => s.key));
  const [currentSections, setCurrentSections] = useState(cloneDeep(initialState.templateSections?.length ? initialState.templateSections : doc.sections));

  useEffect(() => {
    const newAlerts = [...globalAlerts];

    if (doc.archived) {
      newAlerts.push({
        message: t('common:archivedAlert'),
        type: ALERT_TYPE.warning,
        showInFullScreen: false
      });
    }

    if (doc.origin.startsWith(DOCUMENT_ORIGIN.external)) {
      newAlerts.push({
        message:
          (<Trans
            t={t}
            i18nKey="common:externalDocumentWarning"
            components={[<a key="external-document-warning" href={doc.originUrl} />]}
            />),
        type: 'warning',
        showInFullScreen: false
      });
    }

    if (isInEditMode && pendingTemplateSectionKeys?.length) {
      newAlerts.push({
        message: t('proposedSectionsAlert'),
        type: ALERT_TYPE.info,
        showInFullScreen: false
      });
    }

    setAlerts(newAlerts);
  }, [globalAlerts, doc, isInEditMode, pendingTemplateSectionKeys, t]);

  useEffect(() => {
    if (startsInEditMode || isInEditMode) {
      ensureEditorsAreLoaded(editorFactory);
    }
  }, [startsInEditMode, isInEditMode, editorFactory]);

  const handleMetadataEdit = () => {
    setIsDocumentMetadataModalVisible(true);
  };

  const handleDocumentMetadataModalSave = async ({ title, slug, language, tags }) => {
    const mappedDocumentRevision = {
      title,
      slug,
      language,
      tags,
      sections: latestRevision.sections.map(section => ({
        key: section.key,
        type: section.type,
        content: section.content
      })),
      appendTo: {
        key: latestRevision.key,
        ancestorId: latestRevision._id
      }
    };
    const { documentRevision } = await documentApiClient.saveDocument(mappedDocumentRevision);
    const { doc: latestDoc } = await documentApiClient.getDocument(doc.key);

    setDoc(latestDoc);
    setLatestRevision(documentRevision);
    setIsDocumentMetadataModalVisible(false);
  };

  const handleDocumentMetadataModalClose = () => {
    setIsDocumentMetadataModalVisible(false);
  };

  const handleEdit = async () => {
    const { documentRevisions: revisions } = await documentApiClient.getDocumentRevisions(doc.key);

    const newLatestRevision = revisions[revisions.length - 1];

    setIsInEditMode(true);
    setLatestRevision(newLatestRevision);
    setCurrentSections(cloneDeep(newLatestRevision.sections));

    history.replaceState(null, '', urls.getDocUrl({ key: doc.key, slug: doc.slug, view: DOC_VIEW.edit }));
  };

  const handleSave = async () => {
    const mappedDocumentRevision = {
      title: latestRevision.title,
      slug: latestRevision.slug,
      language: latestRevision.language,
      tags: latestRevision.tags,
      sections: currentSections.filter(s => !pendingTemplateSectionKeys.includes(s.key)).map(s => ({
        key: s.key,
        type: s.type,
        content: s.content
      })),
      appendTo: {
        key: latestRevision.key,
        ancestorId: latestRevision._id
      }
    };

    try {
      const { documentRevision: newRevision } = await documentApiClient.saveDocument(mappedDocumentRevision);

      const currentSectionKeys = currentSections.map(s => s.key);
      if (newRevision.sections.some(s => !currentSectionKeys.includes(s.key))) {
        throw new Error('Updated sections do not match exiting sections');
      }

      const newPendingTemplateSectionKeys = [];
      const mergedSections = currentSections.map(currentSection => {
        const updatedSection = newRevision.sections.find(s => s.key === currentSection.key);
        if (updatedSection) {
          return updatedSection;
        }

        newPendingTemplateSectionKeys.push(currentSection.key);
        return currentSection;
      });

      const { doc: latestDoc } = await documentApiClient.getDocument(doc.key);

      setIsDirty(false);
      setDoc(latestDoc);
      setLatestRevision(newRevision);
      setCurrentSections(cloneDeep(mergedSections));
      setPendingTemplateSectionKeys(newPendingTemplateSectionKeys);
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleClose = () => {
    return new Promise(resolve => {
      const exitEditMode = () => {
        setPendingTemplateSectionKeys([]);
        setCurrentSections(latestRevision.sections);

        setIsDirty(false);
        setIsInEditMode(false);
        setInvalidSectionKeys([]);

        history.replaceState(null, '', urls.getDocUrl({ key: doc.key, slug: doc.slug }));

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

  const handleSectionMoved = (sourceIndex, destinationIndex) => {
    const reorderedSections = moveItem(currentSections, sourceIndex, destinationIndex);
    setCurrentSections(reorderedSections);
    setIsDirty(true);
  };

  const handleSectionInserted = (pluginType, index) => {
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

  const handleSectionDuplicated = index => {
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

  const handleSectionDeleted = index => {
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

  const handlePendingSectionApplied = index => {
    const appliedSectionKey = currentSections[index].key;
    setPendingTemplateSectionKeys(prevKeys => ensureIsExcluded(prevKeys, appliedSectionKey));
    setIsDirty(true);
  };

  const handlePendingSectionDiscarded = index => {
    const discardedSection = currentSections[index];
    setCurrentSections(prevSections => ensureIsExcluded(prevSections, discardedSection));
    setIsDirty(true);
  };

  let controlStatus;
  if (invalidSectionKeys.length) {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.invalid;
  } else if (isDirty) {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.dirty;
  } else {
    controlStatus = EDIT_CONTROL_PANEL_STATUS.saved;
  }

  return (
    <Fragment>
      <PageTemplate alerts={alerts}>
        <div className="DocPage">
          <SectionsDisplayNew
            sections={currentSections}
            pendingSectionKeys={pendingTemplateSectionKeys}
            sectionsContainerId={doc.key}
            canEdit={isInEditMode}
            onPendingSectionApplied={handlePendingSectionApplied}
            onPendingSectionDiscarded={handlePendingSectionDiscarded}
            onSectionContentChange={handleSectionContentChange}
            onSectionMoved={handleSectionMoved}
            onSectionInserted={handleSectionInserted}
            onSectionDuplicated={handleSectionDuplicated}
            onSectionDeleted={handleSectionDeleted}
            />
        </div>
        <aside className="Content">
          <CreditsFooter documentOrRevision={doc} type={DOCUMENT_TYPE.document} />
        </aside>
      </PageTemplate>
      <Restricted to={permissions.EDIT_DOC}>
        <EditControlPanel
          canClose
          canCancel={false}
          startExpanded={startsInEditMode}
          onEdit={handleEdit}
          onMetadataEdit={handleMetadataEdit}
          onSave={handleSave}
          onClose={handleClose}
          status={controlStatus}
          metadata={(
            <span className="DocPage-editControlPanelItem">{doc.title}</span>
          )}
          />
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
    latestRevision: documentRevisionShape,
    templateSections: PropTypes.arrayOf(sectionShape)
  }).isRequired
};

export default Doc;
