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
import { PaperClipOutlined, EditOutlined } from '@ant-design/icons';
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
    const { locale, t } = this.props;
    const revision = this.state.revisions[index];
    const date = moment(revision.updatedOn).locale(locale);

    return (
      <div>
        <div>{t('revision')}: <b>{index + 1}</b></div>
        <div>{t('date')}: <b>{date.format('L, LT')}</b></div>
        <div>{t('user')}: <b>{revision.createdBy.username}</b></div>
        <div>{t('id')}: <b>{revision._id}</b></div>
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

  handleAction({ name, data }) {
    switch (name) {
      case HARD_DELETE:
        return this.hardDelete(data);
      default:
        throw new Error(`Unknown action ${name}`);
    }
  }

  async hardDelete({ sectionKey, sectionRevision, reason, deleteDescendants }) {
    const { documentApiClient } = this.props;
    const { currentRevision } = this.state;
    const documentKey = currentRevision.key;
    try {
      await documentApiClient.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteDescendants });
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }

    const { documentRevisions } = await documentApiClient.getDocumentRevisions(documentKey);
    this.setState(prevState => ({
      revisions: documentRevisions,
      currentRevision: documentRevisions.find(revision => revision._id === prevState.currentRevision._id) || documentRevisions[documentRevisions.length - 1]
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

      revisionPicker = (
        <div className="DocPage-revisionPicker">
          <div className="DocPage-revisionPickerLabel">{t('revision')}:</div>
          <div className="DocPage-revisionPickerSlider">
            <Slider
              min={0}
              max={revisions.length - 1}
              value={revisions.indexOf(currentRevision)}
              step={null}
              marks={marks}
              onChange={this.handleIndexChanged}
              tipFormatter={this.formatRevisionTooltip}
              />
          </div>
          <div className="DocPage-revisionPickerResetButton">
            <Button
              type="primary"
              icon={<PaperClipOutlined />}
              onClick={this.handlePermalinkRequest}
              >
              {t('permalink')}
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
  }).isRequired
};

export default withTranslation('doc')(withLanguage(inject({
  documentApiClient: DocumentApiClient
}, Doc)));
