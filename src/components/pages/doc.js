import PropTypes from 'prop-types';
import DocView from '../doc-view.js';
import urls from '../../utils/urls.js';
import React, { useState } from 'react';
import Restricted from '../restricted.js';
import clipboardCopy from 'clipboard-copy';
import Logger from '../../common/logger.js';
import { Button, Slider, message } from 'antd';
import CreditsFooter from '../credits-footer.js';
import { useService } from '../container-context.js';
import permissions from '../../domain/permissions.js';
import { Trans, useTranslation } from 'react-i18next';
import { HARD_DELETE } from '../../ui/section-actions.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { useDateFormat, useLanguage } from '../language-context.js';
import DocumentApiClient from '../../services/document-api-client.js';
import errorHelper, { handleApiError } from '../../ui/error-helper.js';
import { documentRevisionShape } from '../../ui/default-prop-types.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import { confirmDocumentRevisionRestoration } from '../confirmation-dialogs.js';
import { ALERT_TYPE, DOCUMENT_TYPE, DOCUMENT_ORIGIN } from '../../common/constants.js';
import { PaperClipOutlined, ReloadOutlined, EditOutlined, SlidersOutlined, FormOutlined } from '@ant-design/icons';

const logger = new Logger(import.meta.url);

function Doc({ initialState, PageTemplate }) {
  const { t } = useTranslation('doc');
  const { formatDate } = useDateFormat();

  const { language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const documentApiClient = useService(DocumentApiClient);

  const [state, setState] = useState({
    revisions: [],
    currentDocOrRevision: initialState.currentDocOrRevision,
    type: initialState.type
  });

  const handleEditClick = () => {
    window.location = urls.getEditDocUrl(state.currentDocOrRevision.key);
  };

  const handleViewRevionsClick = async () => {
    const { key: docKey } = state.currentDocOrRevision;
    try {
      const { documentRevisions } = await documentApiClient.getDocumentRevisions(docKey);
      setState({
        currentDocOrRevision: documentRevisions[documentRevisions.length - 1],
        revisions: documentRevisions,
        type: DOCUMENT_TYPE.revision
      });
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleViewDocumentClick = () => {
    window.location.reload();
  };

  const formatRevisionTooltip = index => {
    const revision = state.revisions[index];
    const languageName = languageNameProvider.getData(language)[revision.language].name;

    return (
      <div>
        <div>{t('revision')}: <b>{index + 1}</b></div>
        <div>{t('date')}: <b>{formatDate(revision.createdOn)}</b></div>
        <div>{t('language')}: <b>{languageName}</b></div>
        <div>{t('user')}: <b>{revision.createdBy.username}</b></div>
        <div>{t('id')}: <b>{revision._id}</b></div>
        {revision.restoredFrom && <div style={{ whiteSpace: 'nowrap' }}>{t('restoredFrom')}: <b>{revision.restoredFrom}</b></div>}
      </div>
    );
  };

  const handleIndexChanged = index => {
    setState(prevState => ({ ...prevState, currentDocOrRevision: prevState.revisions[index] }));
  };

  const handlePermalinkRequest = async () => {
    const permalinkUrl = urls.createFullyQualifiedUrl(urls.getDocumentRevisionUrl(state.currentDocOrRevision._id));
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

  const handleRestoreButtonClick = () => {
    confirmDocumentRevisionRestoration(
      t,
      state.currentDocOrRevision,
      async () => {
        try {
          const { documentRevisions } = await documentApiClient.restoreDocumentRevision({
            documentKey: state.currentDocOrRevision.key,
            revisionId: state.currentDocOrRevision._id
          });

          setState({
            revisions: documentRevisions,
            currentDocOrRevision: documentRevisions[documentRevisions.length - 1],
            type: DOCUMENT_TYPE.revision
          });
        } catch (error) {
          errorHelper.handleApiError({ error, logger, t });
          throw error;
        }
      }
    );
  };

  const hardDelete = async ({ sectionKey, sectionRevision, reason, deleteAllRevisions }) => {
    const documentKey = state.currentDocOrRevision.key;
    try {
      await documentApiClient.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }

    const { documentRevisions } = await documentApiClient.getDocumentRevisions(documentKey);
    setState(prevState => ({
      revisions: documentRevisions,
      currentDocOrRevision: documentRevisions.find(revision => revision._id === prevState.currentDocOrRevision._id),
      type: DOCUMENT_TYPE.revision
    }));
  };

  const handleAction = ({ name, data }) => {
    switch (name) {
      case HARD_DELETE:
        return hardDelete(data);
      default:
        throw new Error(`Unknown action ${name}`);
    }
  };

  const marks = state.revisions.reduce((accu, _item, index) => {
    accu[index] = index === 0 || index === state.revisions.length - 1 ? (index + 1).toString() : '';
    return accu;
  }, {});

  const currentRevisionIndex = state.revisions.indexOf(state.currentDocOrRevision);
  const isCurrentRevisionLatestRevision = currentRevisionIndex === state.revisions.length - 1;

  const isExternalDocument = state.currentDocOrRevision.origin.startsWith(DOCUMENT_ORIGIN.external);
  const isEditingDisabled = state.currentDocOrRevision.archived || isExternalDocument || state.type !== DOCUMENT_TYPE.document;
  const shouldShowViewRevisionsButton = state.type === DOCUMENT_TYPE.document;
  const shouldShowViewDocumentButton = state.type === DOCUMENT_TYPE.revision;
  const shouldOfferHardDelete = state.type === DOCUMENT_TYPE.revision;

  const revisionPicker = (
    <div className="DocPage-revisionPicker">
      <div className="DocPage-revisionPickerLabel">{t('revision')}:</div>
      <div className="DocPage-revisionPickerSlider">
        <Slider
          min={0}
          max={state.revisions.length - 1}
          value={currentRevisionIndex}
          step={null}
          marks={marks}
          onChange={handleIndexChanged}
          tipFormatter={formatRevisionTooltip}
          />
      </div>
      <div className="DocPage-revisionPickerButtons">
        <Button
          className="DocPage-revisionPickerButton"
          type="primary"
          icon={<PaperClipOutlined />}
          onClick={handlePermalinkRequest}
          >
          {t('permalink')}
        </Button>
        {!isExternalDocument && (
          <Restricted to={permissions.RESTORE_DOC_REVISIONS}>
            <Button
              className="DocPage-revisionPickerButton"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRestoreButtonClick}
              disabled={isCurrentRevisionLatestRevision}
              >
              {t('restore')}
            </Button>
          </Restricted>
        )}
      </div>
    </div>
  );

  const alerts = useGlobalAlerts();
  if (state.currentDocOrRevision.archived) {
    alerts.push({
      message: t('common:archivedAlert'),
      type: ALERT_TYPE.warning
    });
  }

  if (isExternalDocument) {
    alerts.push({
      message:
        (<Trans
          t={t}
          i18nKey="common:externalDocumentWarning"
          components={[<a key="external-document-warning" href={state.currentDocOrRevision.originUrl} />]}
          />),
      type: 'warning'
    });
  }

  const headerActions = [];
  if (!isEditingDisabled) {
    headerActions.push({
      key: 'edit',
      type: 'primary',
      icon: EditOutlined,
      text: t('common:edit'),
      permission: permissions.EDIT_DOC,
      handleClick: handleEditClick
    });
  }
  if (shouldShowViewRevisionsButton) {
    headerActions.push({
      key: 'viewRevisions',
      type: 'primary',
      icon: SlidersOutlined,
      text: t('common:viewRevisions'),
      permission: permissions.VIEW_DOCS,
      handleClick: handleViewRevionsClick
    });
  }

  if (shouldShowViewDocumentButton) {
    headerActions.push({
      key: 'viewDocument',
      type: 'primary',
      icon: FormOutlined,
      text: t('common:viewDocument'),
      permission: permissions.VIEW_DOCS,
      handleClick: handleViewDocumentClick
    });
  }

  return (
    <PageTemplate headerActions={headerActions} alerts={alerts}>
      <div className="DocPage">
        { state.revisions.length > 0 && revisionPicker}
        <DocView
          documentOrRevision={state.currentDocOrRevision}
          onAction={shouldOfferHardDelete ? handleAction : null}
          />
      </div>
      <aside className="Content">
        <CreditsFooter documentOrRevision={state.currentDocOrRevision} type={state.type} />
      </aside>
    </PageTemplate>
  );
}

Doc.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    currentDocOrRevision: PropTypes.instanceOf(documentRevisionShape),
    type: PropTypes.oneOf(Object.values(DOCUMENT_TYPE))
  }).isRequired
};

export default Doc;
