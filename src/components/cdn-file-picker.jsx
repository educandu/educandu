const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const Modal = require('antd/lib/modal');
const Button = require('antd/lib/button');
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

    autoBind.react(this);

    this.state = {
      isModalVisible: false,
      currentSelectedFile: null
    };
  }

  handleSelectButtonClick() {
    this.setState({ isModalVisible: true });
  }

  handleApply() {
    const { onFileNameChanged } = this.props;
    const { currentSelectedFile } = this.state;

    this.setState({ isModalVisible: false });
    onFileNameChanged(currentSelectedFile);
  }

  handleCancel() {
    this.setState({ isModalVisible: false });
  }

  handleSelectionChanged(objects) {
    const newSelectedFile = objects.length ? objects[0].name : null;
    this.setState({ currentSelectedFile: newSelectedFile });
  }

  render() {
    const { rootPrefix } = this.props;
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
            selectionMode={selection.SINGLE}
            onSelectionChanged={this.handleSelectionChanged}
            />
        </Modal>
      </div>
    );
  }
}

CdnFilePicker.propTypes = {
  onFileNameChanged: PropTypes.func,
  rootPrefix: PropTypes.string.isRequired
};

CdnFilePicker.defaultProps = {
  onFileNameChanged: () => {}
};

module.exports = CdnFilePicker;
