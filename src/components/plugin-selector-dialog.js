import PropTypes from 'prop-types';
import { Button, Modal } from 'antd';
import GridSelector from './grid-selector.js';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { useService } from './container-context.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import { PaperClipOutlined, QuestionOutlined } from '@ant-design/icons';

function PluginSelectorDialog({ visible, onSelect, onCancel, onPasteFromClipboard }) {
  const { t } = useTranslation('pluginSelectorDialog');
  const pluginRegistry = useService(PluginRegistry);

  const pluginItems = useMemo(() => {
    return pluginRegistry.getAllInfos()
      .map(info => ({
        key: info.type,
        icon: info.getIcon?.(t) || <QuestionOutlined />,
        label: info.getName(t)
      }));
  }, [pluginRegistry, t]);

  const [selectedPluginType, setSelectedPluginType] = useState(pluginItems[0]?.key || null);

  const handleOk = () => {
    onSelect(selectedPluginType);
  };

  const handleSelectionChange = (type, isConfirmed) => {
    setSelectedPluginType(type);
    if (isConfirmed) {
      onSelect(type);
    }
  };

  const renderFooter = () => (
    <div className="PluginSelectorDialog-footer">
      <div>
        <Button
          icon={<PaperClipOutlined />}
          onClick={onPasteFromClipboard}
          className="PluginSelectorDialog-pasteButton"
          >
          {t('common:pasteFromClipboard')}
        </Button>
      </div>
      <div>
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
      className="PluginSelectorDialog"
      visible={visible}
      title={t('title')}
      footer={renderFooter()}
      onCancel={onCancel}
      >
      <GridSelector
        items={pluginItems}
        selectedItemKey={selectedPluginType}
        onSelectionChange={handleSelectionChange}
        />
    </Modal>
  );
}

PluginSelectorDialog.propTypes = {
  onCancel: PropTypes.func,
  onPasteFromClipboard: PropTypes.func,
  onSelect: PropTypes.func,
  visible: PropTypes.bool
};

PluginSelectorDialog.defaultProps = {
  onCancel: () => {},
  onPasteFromClipboard: () => {},
  onSelect: () => {},
  visible: false
};

export default PluginSelectorDialog;
