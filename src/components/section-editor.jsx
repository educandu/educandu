const React = require('react');
const autoBind = require('auto-bind');
const Icon = require('antd/lib/icon');
const Menu = require('antd/lib/menu');
const Modal = require('antd/lib/modal');
const PropTypes = require('prop-types');
const Radio = require('antd/lib/radio');
const classNames = require('classnames');
const Button = require('antd/lib/button');
const Dropdown = require('antd/lib/dropdown');
const { sectionShape } = require('../ui/default-prop-types');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const confirm = Modal.confirm;

const SECTION_MENU_KEY_MOVE_UP = 'move-up';
const SECTION_MENU_KEY_MOVE_DOWN = 'move-down';
const SECTION_MENU_KEY_DELETE = 'delete';

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

  handleSectionMenuClick({ key }) {
    const { section, onSectionMovedUp, onSectionMovedDown, onSectionDeleted } = this.props;
    switch (key) {
      case SECTION_MENU_KEY_MOVE_UP:
        onSectionMovedUp(section.key);
        break;
      case SECTION_MENU_KEY_MOVE_DOWN:
        onSectionMovedDown(section.key);
        break;
      case SECTION_MENU_KEY_DELETE:
        this.confirmDelete(() => onSectionDeleted(section.key));
        break;
      default:
        break;
    }
  }

  confirmDelete(onOk, onCancel = (() => {})) {
    confirm({
      title: 'Sind Sie sicher?',
      content: 'Möchten Sie diesen Abschnitt löschen?',
      okText: 'Ja',
      okType: 'danger',
      cancelText: 'Nein',
      onOk: onOk,
      onCancel: onCancel
    });
  }

  handleContentChange(updatedContent) {
    const { onContentChanged, section, language } = this.props;
    onContentChanged(section.key, { ...section.content, [language]: updatedContent });
  }

  render() {
    const { mode } = this.state;
    const { section, EditorComponent, DisplayComponent, dragHandleProps, isHighlighted, language } = this.props;

    let componentToShow;
    switch (mode) {
      case 'preview':
        componentToShow = <DisplayComponent content={section.content[language]} language={language} />;
        break;
      case 'edit':
        componentToShow = <EditorComponent content={section.content[language]} onContentChanged={this.handleContentChange} language={language} />;
        break;
      default:
        componentToShow = null;
        break;
    }

    const panelClasses = classNames({
      'Panel': true,
      'is-highlighted': isHighlighted
    });

    const sectionMenu = (
      <Menu onClick={this.handleSectionMenuClick}>
        <Menu.Item key={SECTION_MENU_KEY_MOVE_UP}>
          <Icon type="arrow-up" />&nbsp;&nbsp;<span>Nach oben verschieben</span>
        </Menu.Item>
        <Menu.Item key={SECTION_MENU_KEY_MOVE_DOWN}>
          <Icon type="arrow-down" />&nbsp;&nbsp;<span>Nach unten verschieben</span>
        </Menu.Item>
        <Menu.Item key={SECTION_MENU_KEY_DELETE}>
          <Icon type="delete" style={{ color: 'red' }} />&nbsp;&nbsp;<span>Löschen</span>
        </Menu.Item>
      </Menu>
    );

    return (
      <div className={panelClasses}>
        <div className="Panel-header" style={{ display: 'flex' }} {...dragHandleProps}>
          <div style={{ flex: '1 0 0%' }}>
            <span>Typ:</span> <b>{section.type}</b>
            <span>&nbsp;&nbsp;&nbsp;</span>
            <span>Key:</span> <b>{section.key}</b>
            <span>&nbsp;&nbsp;&nbsp;</span>
            <span>Revision:</span> <b>{section._id}</b>
          </div>
          <div style={{ flex: 'none' }}>
            <Dropdown key="new-section-dropdown" overlay={sectionMenu} placement="bottomRight">
              <Button type="ghost" icon="setting" size="small" />
            </Dropdown>
          </div>
        </div>
        <div className="Panel-content">
          {componentToShow}
        </div>
        <div className="Panel-footer">
          <RadioGroup size="small" value={mode} onChange={this.handleModeChange}>
            <RadioButton value="preview">
              <Icon type="eye-o" />&nbsp;Vorschau
            </RadioButton>
            <RadioButton value="edit">
              <Icon type="edit" />&nbsp;Bearbeiten
            </RadioButton>
          </RadioGroup>
        </div>
      </div>
    );
  }
}

SectionEditor.propTypes = {
  DisplayComponent: PropTypes.func.isRequired,
  EditorComponent: PropTypes.func.isRequired,
  dragHandleProps: PropTypes.object,
  isHighlighted: PropTypes.bool,
  language: PropTypes.string.isRequired,
  onContentChanged: PropTypes.func.isRequired,
  onSectionDeleted: PropTypes.func.isRequired,
  onSectionMovedDown: PropTypes.func.isRequired,
  onSectionMovedUp: PropTypes.func.isRequired,
  section: sectionShape.isRequired
};

SectionEditor.defaultProps = {
  dragHandleProps: {},
  isHighlighted: false
};

module.exports = SectionEditor;
