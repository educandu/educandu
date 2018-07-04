const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Radio, Button, Icon, Modal } = require('antd');
const { sortableHandle } = require('react-sortable-hoc');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const confirm = Modal.confirm;

const DragHandle = sortableHandle(({ children }) => <React.Fragment>{children}</React.Fragment>);

class SectionEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = { mode: 'preview' };
  }

  handleEditClick() {
    this.setState({ mode: 'edit' });
  }

  handlePreviewClick() {
    this.setState({ mode: 'preview' });
  }

  handleModeChange(event) {
    this.setState({ mode: event.target.value });
  }

  handleSectionDeleteClick() {
    confirm({
      title: 'Sind Sie sicher?',
      content: 'Möchten Sie diesen Abschnitt löschen?',
      okText: 'Ja',
      okType: 'danger',
      cancelText: 'Nein',
      onOk: () => {
        const { onSectionDeleted, section } = this.props;
        onSectionDeleted(section.key);
      },
      onCancel: () => {}
    });
  }

  handleContentChange(updatedContent) {
    const { onContentChanged, section, language } = this.props;
    onContentChanged(section.key, { ...section.content, [language]: updatedContent });
  }

  render() {
    const { mode } = this.state;
    const { section, EditorComponent, DisplayComponent, language } = this.props;

    let componentToShow;
    switch (mode) {
      case 'preview':
        componentToShow = <DisplayComponent content={section.content[language]} language={language} />;
        break;
      case 'edit':
        componentToShow = <EditorComponent content={section.content[language]} onContentChanged={this.handleContentChange} language={language} />;
        break;
      default:
        componentToShow = '';
        break;
    }

    const PanelHeader = sortableHandle(() => {
      return (
        <DragHandle>
          <div className="Panel-header" style={{ display: 'flex', cursor: 'move' }}>
            <div style={{ flex: '1 0 0%' }}>
              <span>Typ:</span> <b>{section.type}</b>
              <span>&nbsp;&nbsp;&nbsp;</span>
              <span>Key:</span> <b>{section.key}</b>
              <span>&nbsp;&nbsp;&nbsp;</span>
              <span>Revision:</span> <b>{section._id}</b>
            </div>
            <div style={{ flex: 'none' }}>
              <Button
                size="small"
                type="danger"
                icon="delete"
                onClick={this.handleSectionDeleteClick}
                />
            </div>
          </div>
        </DragHandle>
      );
    });

    return (
      <section key={section.key} className="Section">
        <div className="Panel">
          <PanelHeader />
          <div className="Panel-content">
            {componentToShow}
          </div>
          <div className="Panel-footer">
            <RadioGroup size="small" value={mode} onChange={this.handleModeChange}>
              <RadioButton value="edit">
                <Icon type="edit" />&nbsp;Bearbeiten
              </RadioButton>
              <RadioButton value="preview">
                <Icon type="eye-o" />&nbsp;Vorschau
              </RadioButton>
            </RadioGroup>
          </div>
        </div>
      </section>
    );
  }
}

SectionEditor.propTypes = {
  DisplayComponent: PropTypes.func.isRequired,
  EditorComponent: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
  onContentChanged: PropTypes.func.isRequired,
  onSectionDeleted: PropTypes.func.isRequired,
  section: PropTypes.shape({
    content: PropTypes.any.isRequired,
    key: PropTypes.string.isRequired,
    order: PropTypes.number,
    type: PropTypes.string.isRequired
  }).isRequired
};

module.exports = SectionEditor;
