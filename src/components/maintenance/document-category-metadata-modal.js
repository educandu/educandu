import PropTypes from 'prop-types';
import { Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
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
  const [description, setDescription] = useState(initialDocumentCategory.description);

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

  const handleDescriptionChange = event => {
    const { value } = event.target;
    setDescription(value);
  };

  const renderModalFormNameInputCount = ({ count, maxLength }) => {
    return (
      <div className="u-input-count">{`${count} / ${maxLength}`}</div>
    );
  };

  return (
    <Modal
      width="80%"
      open={isOpen}
      maskClosable={false}
      okText={t('common:create')}
      cancelText={t('common:cancel')}
      title={isEditing ? t('modalEditTitle') : t('modalCreateTitle')}
      onOk={handleOk}
      onCancel={handleCancel}
      >
      <Form
        ref={formRef}
        layout="vertical"
        className="u-modal-body"
        onFinish={handleModalFormFinish}
        >
        <Form.Item label={t('common:name')} {...validationState.name}>
          <Input
            value={name}
            maxLength={maxDocumentCategoryNameLength}
            showCount={{ formatter: renderModalFormNameInputCount }}
            onChange={handleNameChange}
            />
        </Form.Item>
        <Form.Item label={t('common:description')} {...validationState.description}>
          <MarkdownInput
            preview
            minRows={5}
            value={description}
            onChange={handleDescriptionChange}
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
