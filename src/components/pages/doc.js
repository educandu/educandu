import React from 'react';
import moment from 'moment';
import Page from '../page';
import autoBind from 'auto-bind';
import DocView from '../doc-view';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import Logger from '../../common/logger';
import clipboardCopy from 'clipboard-copy';
import { inject } from '../container-context';
import { Button, Slider, message } from 'antd';
import errorHelper from '../../ui/error-helper';
import { withTranslation } from 'react-i18next';
import permissions from '../../domain/permissions';
import { withLanguage } from '../language-context';
import { HARD_DELETE } from '../../ui/section-actions';
import DocumentApiClient from '../../services/document-api-client';
import LanguageNameProvider from '../../data/language-name-provider';
import { confirmDocumentRevisionRestoration } from '../confirmation-dialogs';
import { PaperClipOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { documentRevisionShape, translationProps, languageProps } from '../../ui/default-prop-types';

const logger = new Logger(__filename);

class Doc extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      revisions: props.initialState.documentRevisions,
      currentRevision: props.initialState.documentRevisions[props.initialState.documentRevisions.length - 1]
    };
  }

  handleEditClick() {
    const { currentRevision } = this.state;
    window.location = urls.getEditDocUrl(currentRevision.key);
  }

  handleRevisionChanged(value) {
    const { revisions } = this.state;
    this.setState({ currentRevision: revisions.find(revision => revision._id === value) });
  }

  formatRevisionTooltip(index) {
    const { languageNameProvider, language, locale, t } = this.props;
    const revision = this.state.revisions[index];
    const date = moment(revision.createdOn).locale(locale);
    const languageName = languageNameProvider.getData(language)[revision.language].name;

    return (
      <div>
        <div>{t('revision')}: <b>{index + 1}</b></div>
        <div>{t('date')}: <b>{date.format('L, LT')}</b></div>
        <div>{t('language')}: <b>{languageName}</b></div>
        <div>{t('user')}: <b>{revision.createdBy.username}</b></div>
        <div>{t('id')}: <b>{revision._id}</b></div>
        {revision.restoredFrom && <div style={{ whiteSpace: 'nowrap' }}>{t('restoredFrom')}: <b>{revision.restoredFrom}</b></div>}
      </div>
    );
  }

  handleIndexChanged(index) {
    this.setState(prevState => ({ currentRevision: prevState.revisions[index] }));
  }

  async handlePermalinkRequest() {
    const { t } = this.props;
    const { currentRevision } = this.state;
    const permalinkUrl = urls.createFullyQualifiedUrl(urls.getDocumentRevisionUrl(currentRevision._id));
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
    const { currentRevision } = this.state;

    confirmDocumentRevisionRestoration(
      t,
      currentRevision,
      async () => {
        try {
          const { documentRevisions } = await documentApiClient.restoreDocumentRevision({
            documentKey: currentRevision.key,
            revisionId: currentRevision._id
          });

          this.setState({
            revisions: documentRevisions,
            currentRevision: documentRevisions[documentRevisions.length - 1]
          });
        } catch (error) {
          errorHelper.handleApiError(error, logger);
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
    const { documentApiClient } = this.props;
    const { currentRevision } = this.state;
    const documentKey = currentRevision.key;
    try {
      await documentApiClient.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions });
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }

    const { documentRevisions } = await documentApiClient.getDocumentRevisions(documentKey);
    this.setState(prevState => ({
      revisions: documentRevisions,
      currentRevision: documentRevisions.find(revision => revision._id === prevState.currentRevision._id)
    }));
  }

  render() {
    const { t } = this.props;
    const { revisions, currentRevision } = this.state;

    let revisionPicker = null;

    if (revisions.length > 1) {
      const marks = revisions.reduce((accu, item, index) => {
        accu[index] = index === 0 || index === revisions.length - 1 ? (index + 1).toString() : '';
        return accu;
      }, {});

      const currentRevisionIndex = revisions.indexOf(currentRevision);
      const isCurrentRevisionLatestRevision = currentRevisionIndex === revisions.length - 1;

      revisionPicker = (
        <div className="DocPage-revisionPicker">
          <div className="DocPage-revisionPickerLabel">{t('revision')}:</div>
          <div className="DocPage-revisionPickerSlider">
            <Slider
              min={0}
              max={revisions.length - 1}
              value={currentRevisionIndex}
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
            <Button
              className="DocPage-revisionPickerButton"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={this.handleRestoreButtonClick}
              disabled={isCurrentRevisionLatestRevision}
              >
              {t('restore')}
            </Button>
          </div>
        </div>
      );
    }

    const headerActions = [
      {
        key: 'edit',
        type: 'primary',
        icon: EditOutlined,
        text: t('common:edit'),
        permission: permissions.EDIT_DOC,
        handleClick: this.handleEditClick
      }
    ];

    return (
      <Page headerActions={headerActions}>
        <div className="DocPage">
          {revisionPicker}
          <DocView
            documentOrRevision={currentRevision}
            onAction={this.handleAction}
            />
        </div>
      </Page>
    );
  }
}

Doc.propTypes = {
  ...translationProps,
  ...languageProps,
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.shape({
    documentRevisions: PropTypes.arrayOf(documentRevisionShape)
  }).isRequired,
  languageNameProvider: PropTypes.instanceOf(LanguageNameProvider).isRequired
};

export default withTranslation('doc')(withLanguage(inject({
  documentApiClient: DocumentApiClient,
  languageNameProvider: LanguageNameProvider
}, Doc)));
