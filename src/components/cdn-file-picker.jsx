const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Modal, Button } = require('antd');
const selection = require('../ui/selection');
const RepositoryBrowser = require('./repository-browser.jsx');

const localizedStrings = {
  MODAL_TITLE: 'Dateibrowser',
  BTN_LABEL_SELECT: 'Auswählen',
  BTN_LABEL_CANCEL: 'Abbrechen',
  BTN_LABEL_APPLY: 'Übernehmen'
};

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
    const { rootPrefix, uploadPrefix, initialPrefix } = this.props;
    const { isModalVisible, currentSelectedFile } = this.state;

    return (
      <div className="CdnFilePicker">
        <Button
          type="primary"
          onClick={this.handleSelectButtonClick}
          >
          {localizedStrings.BTN_LABEL_SELECT}
        </Button>
        <Modal
          width="80%"
          visible={isModalVisible}
          title={localizedStrings.MODAL_TITLE}
          onOk={this.handleApply}
          onCancel={this.handleCancel}
          footer={[
            <Button
              key="back"
              onClick={this.handleCancel}
              >
              {localizedStrings.BTN_LABEL_CANCEL}
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={this.handleApply}
              disabled={!currentSelectedFile}
              >
              {localizedStrings.BTN_LABEL_APPLY}
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

module.exports = CdnFilePicker;
