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
import permissions from '../../domain/permissions';
import { HARD_DELETE } from '../../ui/section-actions';
import DocumentApiClient from '../../services/document-api-client';
import { documentRevisionShape } from '../../ui/default-prop-types';
import { PaperClipOutlined, EditOutlined } from '@ant-design/icons';

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
    const revision = this.state.revisions[index];
    const date = moment(revision.updatedOn).locale('de-DE');

    return (
      <div>
        <div>Revision: <b>{index + 1}</b></div>
        <div>Datum: <b>{date.format('L')} {date.format('LT')}</b></div>
        <div>Benutzer: <b>{revision.createdBy.username}</b></div>
        <div>ID: <b>{revision._id}</b></div>
      </div>
    );
  }

  handleIndexChanged(index) {
    this.setState(prevState => ({ currentRevision: prevState.revisions[index] }));
  }

  async handlePermalinkRequest() {
    const { currentRevision } = this.state;
    const permalinkUrl = urls.createFullyQualifiedUrl(urls.getDocumentRevisionUrl(currentRevision._id));
    try {
      await clipboardCopy(permalinkUrl);
      message.success('Der Permalink wurde in die Zwischenablage kopiert');
    } catch (error) {
      const msg = (
        <span>
          <span>Der Permalink konnte nicht in die Zwischenablage kopiert werden:</span>
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
    const { language } = this.props;
    const { revisions, currentRevision } = this.state;

    let revisionPicker = null;

    if (revisions.length > 1) {
      const marks = revisions.reduce((accu, item, index) => {
        accu[index] = index === 0 || index === revisions.length - 1 ? (index + 1).toString() : '';
        return accu;
      }, {});

      revisionPicker = (
        <div className="DocPage-revisionPicker">
          <div className="DocPage-revisionPickerLabel">Revision:</div>
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
              Permalink
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
        text: 'Bearbeiten',
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
            language={language}
            onAction={this.handleAction}
            />
        </div>
      </Page>
    );
  }
}

Doc.propTypes = {
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.shape({
    documentRevisions: PropTypes.arrayOf(documentRevisionShape)
  }).isRequired,
  language: PropTypes.string.isRequired
};

export default inject({
  documentApiClient: DocumentApiClient
}, Doc);
