import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import DeletedSection from './deleted-section.js';
import { useService } from './container-context.js';
import { Menu, Radio, Button, Dropdown } from 'antd';
import EditorFactory from '../plugins/editor-factory.js';
import { pluginTypes } from '../plugins/plugin-infos.js';
import RendererFactory from '../plugins/renderer-factory.js';
import NotSupportedSection from './not-supported-section.js';
import { confirmSectionDelete } from './confirmation-dialogs.js';
import { documentRevisionShape, sectionShape } from '../ui/default-prop-types.js';
import {
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SnippetsOutlined
} from '@ant-design/icons';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const SECTION_MENU_KEY_MOVE_UP = 'move-up';
const SECTION_MENU_KEY_MOVE_DOWN = 'move-down';
const SECTION_MENU_KEY_DELETE = 'delete';
const SECTION_MENU_KEY_DUPLICATE = 'duplicate';

function SectionEditor({
  section,
  onSectionMovedUp,
  onSectionMovedDown,
  onSectionDeleted,
  onSectionDuplicated,
  onSectionRefused,
  onContentChanged,
  onSectionApproved,
  documentRevision,
  dragHandleProps,
  isHighlighted,
  isProposed,
  isInvalid
}) {
  const [mode, setMode] = React.useState('preview');
  const rendererFactory = useService(RendererFactory);
  const editorFactory = useService(EditorFactory);
  const { t } = useTranslation('sectionEditor');

  const handleModeChange = event => {
    setMode(event.target.value);
  };

  const handleSectionMenuClick = ({ key }) => {
    switch (key) {
      case SECTION_MENU_KEY_MOVE_UP:
        onSectionMovedUp(section.key);
        break;
      case SECTION_MENU_KEY_MOVE_DOWN:
        onSectionMovedDown(section.key);
        break;
      case SECTION_MENU_KEY_DELETE:
        confirmSectionDelete(t, section, () => onSectionDeleted(section.key));
        break;
      case SECTION_MENU_KEY_DUPLICATE:
        onSectionDuplicated(section.key);
        break;
      default:
        break;
    }
  };

  const handleContentChange = updatedContent => {
    onContentChanged(section.key, { ...section.content, ...updatedContent }, isInvalid);
  };

  const handleApproved = () => {
    onSectionApproved(section.key);
  };

  const handleRefused = () => {
    onSectionRefused(section.key);
  };

  const getComponentToShow = (hasContent, isSupportedPlugin) => {
    if (!hasContent) {
      return (<DeletedSection section={section} />);
    }

    if (!isSupportedPlugin) {
      return (<NotSupportedSection />);
    }

    if (mode === 'preview' || isProposed) {
      const DisplayComponent = rendererFactory.createRenderer(section.type).getDisplayComponent();
      return (
        <DisplayComponent
          docKey={documentRevision.key}
          sectionKey={section.key}
          content={section.content}
          />
      );
    }

    if (mode === 'edit') {
      const EditorComponent = editorFactory.createEditor(section.type).getEditorComponent();
      return (
        <EditorComponent
          docKey={documentRevision.key}
          sectionKey={section.key}
          content={section.content}
          onContentChanged={handleContentChange}
          />
      );
    }

    return null;
  };

  const hasContent = !!section.content;
  const isSupportedPlugin = pluginTypes.includes(section.type);
  const canBeEdited = hasContent && isSupportedPlugin;
  const componentToShow = getComponentToShow(hasContent, isSupportedPlugin);

  const panelClasses = classNames({
    'Panel': true,
    'is-proposed': isProposed,
    'is-highlighted': !isInvalid && isHighlighted,
    'is-invalid': isInvalid
  });

  const sectionMenu = (
    <Menu onClick={handleSectionMenuClick}>
      <Menu.Item key={SECTION_MENU_KEY_MOVE_UP}>
        <ArrowUpOutlined />&nbsp;&nbsp;<span>{t('common:moveUp')}</span>
      </Menu.Item>
      <Menu.Item key={SECTION_MENU_KEY_MOVE_DOWN}>
        <ArrowDownOutlined />&nbsp;&nbsp;<span>{t('common:moveDown')}</span>
      </Menu.Item>
      <Menu.Item key={SECTION_MENU_KEY_DUPLICATE}>
        <SnippetsOutlined />&nbsp;&nbsp;<span>{t('common:duplicate')}</span>
      </Menu.Item>
      <Menu.Item key={SECTION_MENU_KEY_DELETE}>
        <DeleteOutlined style={{ color: 'red' }} />&nbsp;&nbsp;<span>{t('common:delete')}</span>
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={panelClasses}>
      <div className="Panel-header" style={{ display: 'flex' }} {...dragHandleProps}>
        <div style={{ flex: '1 0 0%' }}>
          <span style={{ display: 'inline-block', marginRight: '1em' }}>
            <span>{t('type')}:</span>&nbsp;<b>{section.type}</b>
          </span>
          <span style={{ display: 'inline-block', marginRight: '1em' }}>
            <span>{t('key')}:</span>&nbsp;<b>{section.key}</b>
          </span>
          <span style={{ display: 'inline-block', marginRight: '1em' }}>
            <span>{t('revision')}:</span>&nbsp;<b>{section.revision || 'N/A'}</b>
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
            <RadioGroup size="small" value={canBeEdited ? mode : 'preview'} onChange={handleModeChange} disabled={isProposed}>
              <RadioButton value="preview">
                <EyeOutlined />&nbsp;{t('common:preview')}
              </RadioButton>
              <RadioButton value="edit" disabled={!canBeEdited}>
                <EditOutlined />&nbsp;{t('common:edit')}
              </RadioButton>
            </RadioGroup>
          </div>
          {isProposed && (
          <div style={{ flex: 'none' }}>
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApproved}
              >
              {t('common:apply')}
            </Button>
                &nbsp;&nbsp;
            <Button
              size="small"
              type="primary"
              icon={<CloseCircleOutlined />}
              onClick={handleRefused}
              danger
              >
              {t('common:discard')}
            </Button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

SectionEditor.propTypes = {
  documentRevision: documentRevisionShape.isRequired,
  dragHandleProps: PropTypes.object,
  isHighlighted: PropTypes.bool,
  isInvalid: PropTypes.bool.isRequired,
  isProposed: PropTypes.bool.isRequired,
  onContentChanged: PropTypes.func.isRequired,
  onSectionApproved: PropTypes.func.isRequired,
  onSectionDeleted: PropTypes.func.isRequired,
  onSectionDuplicated: PropTypes.func.isRequired,
  onSectionMovedDown: PropTypes.func.isRequired,
  onSectionMovedUp: PropTypes.func.isRequired,
  onSectionRefused: PropTypes.func.isRequired,
  section: sectionShape.isRequired
};

SectionEditor.defaultProps = {
  dragHandleProps: {},
  isHighlighted: false
};

export default SectionEditor;
