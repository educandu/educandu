import PropTypes from 'prop-types';
import { Button, Modal } from 'antd';
import GridSelector from './grid-selector.js';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { useService } from './container-context.js';
import { QuestionOutlined } from '@ant-design/icons';
import PluginRegistry from '../plugins/plugin-registry.js';
import PasteFromClipboardIcon from './icons/general/paste-from-clipboard-icon.js';

function PluginSelectorDialog({ isOpen, onSelect, onCancel, onPasteFromClipboard }) {
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
          icon={<PasteFromClipboardIcon />}
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
      centered
      width="560px"
      open={isOpen}
      title={t('title')}
      footer={renderFooter()}
      onCancel={onCancel}
      className="PluginSelectorDialog"
      >
      <div className="u-modal-body">
        <GridSelector
          items={pluginItems}
          selectedItemKey={selectedPluginType}
          onSelectionChange={handleSelectionChange}
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
