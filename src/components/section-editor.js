import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DeletedSection from './deleted-section';
import { Menu, Radio, Button, Dropdown } from 'antd';
import { confirmDelete } from './section-action-dialogs';
import { documentRevisionShape, sectionShape } from '../ui/default-prop-types';
import {
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

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
    const { onContentChanged, section } = this.props;
    onContentChanged(section.key, { ...section.content, ...updatedContent }, isInvalid);
  }

  handleApproved() {
    const { onSectionApproved, section } = this.props;
    onSectionApproved(section.key);
  }

  handleRefused() {
    const { onSectionRefused, section } = this.props;
    onSectionRefused(section.key);
  }

  render() {
    const { mode } = this.state;
    const { documentRevision, section, EditorComponent, DisplayComponent, dragHandleProps, isHighlighted, isProposed, isInvalid, language } = this.props;

    const hasContent = !!section.content;

    let componentToShow;
    if (!hasContent) {
      componentToShow = (
        <DeletedSection section={section} />
      );
    } else if (mode === 'preview' || isProposed) {
      componentToShow = (
        <DisplayComponent
          docKey={documentRevision.key}
          sectionKey={section.key}
          content={section.content}
          language={language}
          />
      );
    } else if (mode === 'edit') {
      componentToShow = (
        <EditorComponent
          docKey={documentRevision.key}
          sectionKey={section.key}
          content={section.content}
          onContentChanged={this.handleContentChange}
          language={language}
          />
      );
    } else {
      componentToShow = null;
    }

    const panelClasses = classNames({
      'Panel': true,
      'is-proposed': isProposed,
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
              <span>Revision:</span>&nbsp;<b>{section.revision || 'N/A'}</b>
            </span>
          </div>
          <div style={{ flex: 'none' }}>
            <Dropdown key="new-section-dropdown" overlay={sectionMenu} placement="bottomRight" disabled={isProposed}>
              <Button type="ghost" icon={<SettingOutlined />} size="small" disabled={isProposed} />
            </Dropdown>
          </div>
        </div>
        <div className="Panel-content">
          {componentToShow}
          {isProposed && <div className="Panel-contentOverlay" />}
        </div>
        <div className="Panel-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ flex: 'none' }}>
              <RadioGroup size="small" value={hasContent ? mode : 'preview'} onChange={this.handleModeChange} disabled={isProposed}>
                <RadioButton value="preview">
                  <EyeOutlined />&nbsp;Vorschau
                </RadioButton>
                <RadioButton value="edit" disabled={!hasContent}>
                  <EditOutlined />&nbsp;Bearbeiten
                </RadioButton>
              </RadioGroup>
            </div>
            {isProposed && (
              <div style={{ flex: 'none' }}>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={this.handleApproved}
                  >
                  Übernehmen
                </Button>
                &nbsp;&nbsp;
                <Button
                  size="small"
                  type="primary"
                  icon={<CloseCircleOutlined />}
                  onClick={this.handleRefused}
                  danger
                  >
                  Verwerfen
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

SectionEditor.propTypes = {
  DisplayComponent: PropTypes.func.isRequired,
  EditorComponent: PropTypes.func.isRequired,
  documentRevision: documentRevisionShape.isRequired,
  dragHandleProps: PropTypes.object,
  isHighlighted: PropTypes.bool,
  isInvalid: PropTypes.bool,
  isProposed: PropTypes.bool,
  language: PropTypes.string.isRequired,
  onContentChanged: PropTypes.func.isRequired,
  onSectionApproved: PropTypes.func.isRequired,
  onSectionDeleted: PropTypes.func.isRequired,
  onSectionMovedDown: PropTypes.func.isRequired,
  onSectionMovedUp: PropTypes.func.isRequired,
  onSectionRefused: PropTypes.func.isRequired,
  section: sectionShape.isRequired
};

SectionEditor.defaultProps = {
  dragHandleProps: {},
  isHighlighted: false,
  isInvalid: false,
  isProposed: false
};

export default SectionEditor;
