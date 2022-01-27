import { Modal } from 'antd';
import PropTypes from 'prop-types';
import GridSelector from './grid-selector.js';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { useService } from './container-context.js';
import InfoFactory from '../plugins/info-factory.js';
import { QuestionOutlined } from '@ant-design/icons';

function PluginSelectorDialog({ visible, onSelect, onCancel }) {
  const { t } = useTranslation('pluginSelectorDialog');
  const infoFactory = useService(InfoFactory);

  const pluginItems = useMemo(() => {
    return infoFactory.getRegisteredTypes()
      .map(typeName => infoFactory.createInfo(typeName))
      .map(info => ({
        key: info.type,
        icon: info.getIcon?.(t) || <QuestionOutlined />,
        label: info.getName(t)
      }));
  }, [infoFactory, t]);

  const [selectedPluginType, setSelectedPluginType] = useState(pluginItems[0]?.key || null);

  const handleOk = () => {
    onSelect(selectedPluginType);
  };

  const handleCancel = () => onCancel?.();

  const handleSelectionChange = (type, isConfirmed) => {
    setSelectedPluginType(type);
    if (isConfirmed) {
      onSelect(type);
    }
  };

  return (
    <Modal
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      title={t('title')}
      okButtonProps={{ disabled: !selectedPluginType }}
      destroyOnClose
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
  onSelect: PropTypes.func,
  visible: PropTypes.bool
};

PluginSelectorDialog.defaultProps = {
  onCancel: () => {},
  onSelect: () => {},
  visible: false
};

export default PluginSelectorDialog;
