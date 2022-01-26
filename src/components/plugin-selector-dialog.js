import PropTypes from 'prop-types';
import { Modal } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InfoFactory from '../plugins/info-factory.js';
import { useService } from './container-context.js';
import GridSelector from './grid-selector.js';

function PluginSelectorDialog({ visible, onSelected, onCancel }) {
  const { t } = useTranslation('pluginSelectorDialog');
  const infoFactory = useService(InfoFactory);

  const pluginItems = useMemo(() => {
    return infoFactory.getRegisteredTypes()
      .map(typeName => infoFactory.createInfo(typeName))
      .map(info => ({
        key: info.type,
        icon: info.getIcon?.(t) || null,
        label: info.getName(t)
      }));
  }, [infoFactory, t]);

  const [selectedPluginType, setSelectedPluginType] = useState(pluginItems[0]?.key || null);

  const handleOk = () => {
    onSelected?.(selectedPluginType);
  };

  const handleCancel = () => onCancel?.();

  const handleSelectionChange = (type, isConfirmed) => {
    setSelectedPluginType(type);
    if (isConfirmed) {
      onSelected(type);
    }
  };

  return (
    <Modal visible={visible} onOk={handleOk} onCancel={handleCancel} title={t('title')} okButtonProps={{ disabled: !selectedPluginType }} destroyOnClose>
      <GridSelector items={pluginItems} selectedItemKey={selectedPluginType} onSelectionChange={handleSelectionChange} />
    </Modal>
  );
}

PluginSelectorDialog.propTypes = {
  onCancel: PropTypes.func,
  onSelected: PropTypes.func,
  visible: PropTypes.bool
};

PluginSelectorDialog.defaultProps = {
  onCancel: () => {},
  onSelected: () => {},
  visible: false
};

export default PluginSelectorDialog;
