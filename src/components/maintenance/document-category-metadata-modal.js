import PropTypes from 'prop-types';
import { Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useRef, useState } from 'react';
import { maxDocumentCategoryNameLength } from '../../domain/validation-constants.js';

function getValidationState({ name, t }) {
  const isValidName = !!name.trim();

  return {
    name: {
      required: true,
      validateStatus: isValidName ? 'success' : 'error',
      help: isValidName ? null : t('nameRequired')
    }
  };
}

function DocumentCategoryMetadataModal({ isOpen, isEditing, initialDocumentCategory, onSave, onClose }) {
  const formRef = useRef(null);
  const { t } = useTranslation('documentCategoryMetadataModal');

  const [name, setName] = useState(initialDocumentCategory.name);

  const validationState = useMemo(
    () => getValidationState({ t, name }),
    [t, name]
  );

  const modalFormHasInvalidFields = () => Object.values(validationState).some(field => field.validateStatus === 'error');

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleModalFormFinish = () => {
    if (modalFormHasInvalidFields()) {
      return;
    }

    onSave();
  };

  const handleNameChange = event => {
    const { value } = event.target;
    setName(value);
  };

  const renderModalFormNameInputCount = ({ count, maxLength }) => {
    return (
      <div className="u-input-count">{`${count} / ${maxLength}`}</div>
    );
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
      <Form ref={formRef} layout="vertical" onFinish={handleModalFormFinish} className="u-modal-body">
        <Form.Item label={t('common:name')} {...validationState.name}>
          <Input
            value={name}
            maxLength={maxDocumentCategoryNameLength}
            showCount={{ formatter: renderModalFormNameInputCount }}
            onChange={handleNameChange}
            />
        </Form.Item>
      </Form>
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
