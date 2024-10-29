import PropTypes from 'prop-types';
import GridSelector from './grid-selector.js';
import { useTranslation } from 'react-i18next';
import { Button, Collapse, Modal } from 'antd';
import React, { useMemo, useState } from 'react';
import { useService } from './container-context.js';
import { QuestionOutlined } from '@ant-design/icons';
import { PLUGIN_GROUP } from '../domain/constants.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import PasteFromClipboardIcon from './icons/general/paste-from-clipboard-icon.js';

function getGroups(pluginInfo) {
  return pluginInfo?.getGroups?.() || [PLUGIN_GROUP.other];
}

function groupPlugins(plugins, t) {
  return Object.values(PLUGIN_GROUP).map(groupKey => ({
    key: groupKey,
    label: t(`pluginGroup_${groupKey}`),
    plugins: plugins.filter(plugin => getGroups(plugin.info).includes(groupKey))
  })).filter(group => !!group.plugins.length);
}

function PluginSelectorDialog({ isOpen, onSelect, onCancel, onPasteFromClipboard }) {
  const { t } = useTranslation('pluginSelectorDialog');
  const pluginRegistry = useService(PluginRegistry);

  const pluginItemGroups = useMemo(() => {
    return groupPlugins(pluginRegistry.getAllRegisteredPlugins(), t);
  }, [pluginRegistry, t]);

  const [activeGroupKey, setActiveGroupKey] = useState(pluginItemGroups[0]?.key || null);
  const [selectedPluginType, setSelectedPluginType] = useState(pluginItemGroups[0]?.[0]?.key || null);

  const handleOk = () => {
    onSelect(selectedPluginType);
  };

  const handleSelectionChange = (type, isConfirmed) => {
    setSelectedPluginType(type);
    if (isConfirmed) {
      onSelect(type);
    }
  };

  const handleCollapseChange = newKeys => {
    if (!newKeys.length) {
      return;
    }

    setActiveGroupKey(newKeys[0]);
    setSelectedPluginType(null);
  };

  const collapseItems = pluginItemGroups.map(group => {
    const gridSelectorItems = group.plugins.map(plugin => ({
      key: plugin.name,
      icon: plugin.info.getIcon?.(t) || <QuestionOutlined />,
      label: plugin.info.getDisplayName(t)
    }));

    return {
      key: group.key,
      label: group.label,
      children: (
        <GridSelector
          items={gridSelectorItems}
          selectedItemKey={selectedPluginType}
          onSelectionChange={handleSelectionChange}
          />
      )
    };
  });

  const renderFooter = () => (
    <div className="PluginSelectorDialog-footer">
      <div>
        <Button
          icon={<PasteFromClipboardIcon />}
          onClick={onPasteFromClipboard}
          className="PluginSelectorDialog-pasteButton"
          >
          {t('common:pasteFromClipboard')}
        </Button>
      </div>
      <div className="PluginSelectorDialog-footerButtonGroup">
        <Button
          onClick={onCancel}
          >
          {t('common:cancel')}
        </Button>
        <Button
          type="primary"
          disabled={!selectedPluginType}
          onClick={handleOk}
          >
          {t('common:ok')}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      centered
      width="560px"
      open={isOpen}
      title={t('title')}
      footer={renderFooter()}
      onCancel={onCancel}
      className="u-modal"
      >
      <div className="u-modal-body">
        <Collapse
          accordion
          items={collapseItems}
          activeKey={activeGroupKey}
          onChange={handleCollapseChange}
          />
      </div>
    </Modal>
  );
}

PluginSelectorDialog.propTypes = {
  isOpen: PropTypes.bool,
  onCancel: PropTypes.func,
  onPasteFromClipboard: PropTypes.func,
  onSelect: PropTypes.func
};

PluginSelectorDialog.defaultProps = {
  isOpen: false,
  onCancel: () => {},
  onPasteFromClipboard: () => {},
  onSelect: () => {}
};

export default PluginSelectorDialog;
