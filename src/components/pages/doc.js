import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import DocView from '../doc-view.js';
import urls from '../../utils/urls.js';
import Restricted from '../restricted.js';
import clipboardCopy from 'clipboard-copy';
import Logger from '../../common/logger.js';
import { withUser } from '../user-context.js';
import { Button, Slider, message } from 'antd';
import { withTranslation } from 'react-i18next';
import { inject } from '../container-context.js';
import CreditsFooter from '../credits-footer.js';
import permissions from '../../domain/permissions.js';
import { withLanguage } from '../language-context.js';
import { withPageName } from '../page-name-context.js';
import { HARD_DELETE } from '../../ui/section-actions.js';
import { getGlobalAlerts } from '../../ui/global-alerts.js';
import { ALERT_TYPE, DOCUMENT_TYPE } from '../../common/constants.js';
import DocumentApiClient from '../../services/document-api-client.js';
import errorHelper, { handleApiError } from '../../ui/error-helper.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import { confirmDocumentRevisionRestoration } from '../confirmation-dialogs.js';
import { PaperClipOutlined, ReloadOutlined, EditOutlined, SlidersOutlined, FormOutlined } from '@ant-design/icons';
import { documentRevisionShape, translationProps, languageProps, userProps, pageNameProps } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

class Doc extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      revisions: [],
      currentDocOrRevision: props.initialState.currentDocOrRevision,
      type: props.initialState.type
    };
  }

  handleEditClick() {
    const { currentDocOrRevision } = this.state;
    window.location = urls.getEditDocUrl(currentDocOrRevision.key);
  }

  async handleViewVersionsClick() {
    const { documentApiClient, t } = this.props;
    const { key: docKey } = this.state.currentDocOrRevision;
    try {
      const { documentRevisions } = await documentApiClient.getDocumentRevisions(docKey);
      this.setState({
        currentDocOrRevision: documentRevisions[documentRevisions.length - 1],
        revisions: documentRevisions,
        type: DOCUMENT_TYPE.revision
      });
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  }

  handleViewDocumentClick() {
    window.location.reload();
  }

  formatRevisionTooltip(index) {
    const { languageNameProvider, language, t, formatDate } = this.props;
    const revision = this.state.revisions[index];
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
  }

  handleIndexChanged(index) {
    this.setState(prevState => ({ currentDocOrRevision: prevState.revisions[index] }));
  }

  async handlePermalinkRequest() {
    const { t } = this.props;
    const { currentDocOrRevision } = this.state;
    const permalinkUrl = urls.createFullyQualifiedUrl(urls.getDocumentRevisionUrl(currentDocOrRevision._id));
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
  }

  handleRestoreButtonClick() {
    const { documentApiClient, t } = this.props;
    const { currentDocOrRevision } = this.state;

    confirmDocumentRevisionRestoration(
      t,
      currentDocOrRevision,
      async () => {
        try {
          const { documentRevisions } = await documentApiClient.restoreDocumentRevision({
            documentKey: currentDocOrRevision.key,
            revisionId: currentDocOrRevision._id
          });

          this.setState({
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
  }

  handleAction({ name, data }) {
    switch (name) {
      case HARD_DELETE:
        return this.hardDelete(data);
      default:
        throw new Error(`Unknown action ${name}`);
    }
  }

  async hardDelete({ sectionKey, sectionRevision, reason, deleteAllRevisions }) {
    const { documentApiClient, t } = this.props;
    const { currentDocOrRevision } = this.state;
    const documentKey = currentDocOrRevision.key;
    try {
      await documentApiClient.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }

    const { documentRevisions } = await documentApiClient.getDocumentRevisions(documentKey);
    this.setState(prevState => ({
      revisions: documentRevisions,
      currentDocOrRevision: documentRevisions.find(revision => revision._id === prevState.currentDocOrRevision._id)
    }));
  }

  render() {
    const { pageName, user, t, PageTemplate } = this.props;
    const { revisions, currentDocOrRevision } = this.state;

    const marks = revisions.reduce((accu, item, index) => {
      accu[index] = index === 0 || index === revisions.length - 1 ? (index + 1).toString() : '';
      return accu;
    }, {});

    const currentDocOrRevisionIndex = revisions.indexOf(currentDocOrRevision);
    const isCurrentDocOrRevisionLatestRevision = currentDocOrRevisionIndex === revisions.length - 1;

    const revisionPicker = (
      <div className="DocPage-revisionPicker">
        <div className="DocPage-revisionPickerLabel">{t('revision')}:</div>
        <div className="DocPage-revisionPickerSlider">
          <Slider
            min={0}
            max={revisions.length - 1}
            value={currentDocOrRevisionIndex}
            step={null}
            marks={marks}
            onChange={this.handleIndexChanged}
            tipFormatter={this.formatRevisionTooltip}
            />
        </div>
        <div className="DocPage-revisionPickerButtons">
          <Button
            className="DocPage-revisionPickerButton"
            type="primary"
            icon={<PaperClipOutlined />}
            onClick={this.handlePermalinkRequest}
            >
            {t('permalink')}
          </Button>
          <Restricted to={permissions.RESTORE_DOC_REVISIONS}>
            <Button
              className="DocPage-revisionPickerButton"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={this.handleRestoreButtonClick}
              disabled={isCurrentDocOrRevisionLatestRevision}
              >
              {t('restore')}
            </Button>
          </Restricted>
        </div>
      </div>
    );

    const alerts = getGlobalAlerts(pageName, user);
    if (currentDocOrRevision.archived) {
      alerts.push({
        message: t('common:archivedAlert'),
        type: ALERT_TYPE.warning
      });
    }

    const headerActions = [];
    if (this.state.type === DOCUMENT_TYPE.document) {
      headerActions.push({
        key: 'viewRevisions',
        type: 'primary',
        icon: SlidersOutlined,
        text: t('common:viewVersions'),
        permission: permissions.VIEW_DOCS,
        handleClick: this.handleViewVersionsClick
      });
    }

    if (this.state.type === DOCUMENT_TYPE.revision) {
      headerActions.push({
        key: 'viewDocument',
        type: 'primary',
        icon: FormOutlined,
        text: t('common:viewDocument'),
        permission: permissions.VIEW_DOCS,
        handleClick: this.handleViewDocumentClick
      });
    }

    if (!currentDocOrRevision.archived && this.state.type === DOCUMENT_TYPE.document) {
      headerActions.push({
        key: 'edit',
        type: 'primary',
        icon: EditOutlined,
        text: t('common:edit'),
        permission: permissions.EDIT_DOC,
        handleClick: this.handleEditClick
      });
    }

    return (
      <PageTemplate headerActions={headerActions} alerts={alerts}>
        <div className="DocPage">
          { this.state.revisions.length > 0 && revisionPicker}
          <DocView
            documentOrRevision={currentDocOrRevision}
            onAction={this.handleAction}
            />
        </div>
        <aside className="Content">
          <CreditsFooter documentOrRevision={currentDocOrRevision} type={this.state.type} />
        </aside>
      </PageTemplate>
    );
  }
}

Doc.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  ...translationProps,
  ...languageProps,
  ...userProps,
  ...pageNameProps,
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.shape({
    currentDocOrRevision: PropTypes.instanceOf(documentRevisionShape),
    type: PropTypes.oneOf(Object.values(DOCUMENT_TYPE))
  }).isRequired,
  languageNameProvider: PropTypes.instanceOf(LanguageNameProvider).isRequired
};

export default withTranslation('doc')(withLanguage(withUser(withPageName(inject({
  documentApiClient: DocumentApiClient,
  languageNameProvider: LanguageNameProvider
}, Doc)))));
