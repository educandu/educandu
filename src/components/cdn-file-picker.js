import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';
import selection from '../ui/selection.js';
import { withTranslation } from 'react-i18next';
import RepositoryBrowser from './repository-browser.js';
import { translationProps } from '../ui/default-prop-types.js';

class CdnFilePicker extends React.Component {
  constructor(props) {
    super(props);

    autoBind(this);

    this.state = {
      isModalVisible: false,
      currentSelectedFile: null
    };
  }

  handleSelectButtonClick() {
    this.setState({ isModalVisible: true });
  }

  handleApply() {
    const { currentSelectedFile } = this.state;
    this.applySelection(currentSelectedFile);
  }

  handleCancel() {
    this.setState({ isModalVisible: false });
  }

  handleSelectionChanged(objects, applySelection) {
    const newSelectedFile = objects.length ? objects[0].name : null;
    this.setState({ currentSelectedFile: newSelectedFile });

    if (applySelection) {
      this.applySelection(newSelectedFile);
    }
  }

  applySelection(currentSelectedFile) {
    const { onFileNameChanged } = this.props;
    onFileNameChanged(currentSelectedFile);

    this.setState({ isModalVisible: false });
  }

  render() {
    const { rootPrefix, uploadPrefix, initialPrefix, t } = this.props;
    const { isModalVisible, currentSelectedFile } = this.state;

    return (
      <div className="CdnFilePicker">
        <Button
          type="primary"
          onClick={this.handleSelectButtonClick}
          >
          {t('common:select')}
        </Button>
        <Modal
          width="80%"
          visible={isModalVisible}
          title={t('modalTitle')}
          onOk={this.handleApply}
          onCancel={this.handleCancel}
          footer={[
            <Button
              key="back"
              onClick={this.handleCancel}
              >
              {t('common:cancel')}
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={this.handleApply}
              disabled={!currentSelectedFile}
              >
              {t('common:apply')}
            </Button>
          ]}
          >
          <RepositoryBrowser
            rootPrefix={rootPrefix}
            uploadPrefix={uploadPrefix}
            initialPrefix={initialPrefix}
            selectionMode={selection.SINGLE}
            onSelectionChanged={this.handleSelectionChanged}
            />
        </Modal>
      </div>
    );
  }
}

CdnFilePicker.propTypes = {
  ...translationProps,
  initialPrefix: PropTypes.string,
  onFileNameChanged: PropTypes.func,
  rootPrefix: PropTypes.string.isRequired,
  uploadPrefix: PropTypes.string
};

CdnFilePicker.defaultProps = {
  initialPrefix: null,
  onFileNameChanged: () => {},
  uploadPrefix: null
};

export default withTranslation('cdnFilePicker')(CdnFilePicker);
