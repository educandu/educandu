import React from 'react';
import { Modal } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function DocumentCategoryMetadataModal({ isOpen, isEditing, initialDocumentCategory, onSave, onClose }) {
  const { t } = useTranslation('documentCategoryMetadataModal');

  const handleOk = () => {
    onSave();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      maskClosable={false}
      open={isOpen}
      okText={t('common:create')}
      cancelText={t('common:cancel')}
      title={isEditing ? t('modalEditTitle') : t('modalCreateTitle')}
      onOk={handleOk}
      onCancel={handleCancel}
      >
      {initialDocumentCategory.name}
    </Modal>
  );
}

DocumentCategoryMetadataModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  initialDocumentCategory: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default DocumentCategoryMetadataModal;
