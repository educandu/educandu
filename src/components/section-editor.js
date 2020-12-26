import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DeletedSection from './deleted-section';
import { Menu, Radio, Button, Dropdown } from 'antd';
import { confirmDelete } from './section-action-dialogs';
import { docShape, sectionShape } from '../ui/default-prop-types';
import { SettingOutlined, ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const SECTION_MENU_KEY_MOVE_UP = 'move-up';
const SECTION_MENU_KEY_MOVE_DOWN = 'move-down';
const SECTION_MENU_KEY_DELETE = 'delete';

class SectionEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
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
        confirmDelete(section, () => onSectionDeleted(section.key));
        break;
      default:
        break;
    }
  }

  handleContentChange(updatedContent, isInvalid = false) {
    const { onContentChanged, section, language } = this.props;
    onContentChanged(section.key, { ...section.content, [language]: updatedContent }, isInvalid);
  }

  render() {
    const { mode } = this.state;
    const { doc, section, EditorComponent, DisplayComponent, dragHandleProps, isHighlighted, isInvalid, language } = this.props;

    const hasContent = !!section.content;

    let componentToShow;
    if (!hasContent) {
      componentToShow = (
        <DeletedSection section={section} />
      );
    } else if (mode === 'preview') {
      componentToShow = (
        <DisplayComponent
          docKey={doc.key}
          sectionKey={section.key}
          content={section.content[language]}
          language={language}
          />
      );
    } else if (mode === 'edit') {
      componentToShow = (
        <EditorComponent
          docKey={doc.key}
          sectionKey={section.key}
          content={section.content[language]}
          onContentChanged={this.handleContentChange}
          language={language}
          />
      );
    } else {
      componentToShow = null;
    }

    const panelClasses = classNames({
      'Panel': true,
      'is-highlighted': !isInvalid && isHighlighted,
      'is-invalid': isInvalid
    });

    const sectionMenu = (
      <Menu onClick={this.handleSectionMenuClick}>
        <Menu.Item key={SECTION_MENU_KEY_MOVE_UP}>
          <ArrowUpOutlined />&nbsp;&nbsp;<span>Nach oben verschieben</span>
        </Menu.Item>
        <Menu.Item key={SECTION_MENU_KEY_MOVE_DOWN}>
          <ArrowDownOutlined />&nbsp;&nbsp;<span>Nach unten verschieben</span>
        </Menu.Item>
        <Menu.Item key={SECTION_MENU_KEY_DELETE}>
          <DeleteOutlined style={{ color: 'red' }} />&nbsp;&nbsp;<span>Löschen</span>
        </Menu.Item>
      </Menu>
    );

    return (
      <div className={panelClasses}>
        <div className="Panel-header" style={{ display: 'flex' }} {...dragHandleProps}>
          <div style={{ flex: '1 0 0%' }}>
            <span style={{ display: 'inline-block', marginRight: '1em' }}>
              <span>Typ:</span>&nbsp;<b>{section.type}</b>
            </span>
            <span style={{ display: 'inline-block', marginRight: '1em' }}>
              <span>Key:</span>&nbsp;<b>{section.key}</b>
            </span>
            <span style={{ display: 'inline-block', marginRight: '1em' }}>
              <span>Revision:</span>&nbsp;<b>{section._id}</b>
            </span>
          </div>
          <div style={{ flex: 'none' }}>
            <Dropdown key="new-section-dropdown" overlay={sectionMenu} placement="bottomRight">
              <Button type="ghost" icon={<SettingOutlined />} size="small" />
            </Dropdown>
          </div>
        </div>
        <div className="Panel-content">
          {componentToShow}
        </div>
        <div className="Panel-footer">
          <RadioGroup size="small" value={hasContent ? mode : 'preview'} onChange={this.handleModeChange}>
            <RadioButton value="preview">
              <EyeOutlined />&nbsp;Vorschau
            </RadioButton>
            <RadioButton value="edit" disabled={!hasContent}>
              <EditOutlined />&nbsp;Bearbeiten
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
  doc: docShape.isRequired,
  dragHandleProps: PropTypes.object,
  isHighlighted: PropTypes.bool,
  isInvalid: PropTypes.bool,
  language: PropTypes.string.isRequired,
  onContentChanged: PropTypes.func.isRequired,
  onSectionDeleted: PropTypes.func.isRequired,
  onSectionMovedDown: PropTypes.func.isRequired,
  onSectionMovedUp: PropTypes.func.isRequired,
  section: sectionShape.isRequired
};

SectionEditor.defaultProps = {
  dragHandleProps: {},
  isHighlighted: false,
  isInvalid: false
};

export default SectionEditor;
