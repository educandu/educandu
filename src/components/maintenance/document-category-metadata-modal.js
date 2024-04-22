import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import { maxDocumentCategoryNameLength } from '../../domain/validation-constants.js';

function DocumentCategoryMetadataModal({ isOpen, isEditing, initialDocumentCategory, onSave, onClose }) {
  const [form] = Form.useForm();
  const { t } = useTranslation('documentCategoryMetadataModal');

  const nameValidationRules = [{
    required: true,
    message: t('nameRequired'),
    whitespace: true
  }];

  const handleOk = () => {
    form.submit();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleModalFormFinish = async ({ name, description }) => {
    console.log('finish', name.trim(), description.trim());
    await onSave();
    form.resetFields();
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
        form={form}
        layout="vertical"
        className="u-modal-body"
        validateTrigger="onSubmit"
        onFinish={handleModalFormFinish}
        >
        <Form.Item
          name="name"
          label={t('common:name')}
          rules={nameValidationRules}
          initialValue={initialDocumentCategory.name}
          >
          <Input
            maxLength={maxDocumentCategoryNameLength}
            showCount={{ formatter: renderModalFormNameInputCount }}
            />
        </Form.Item>
        <Form.Item
          name="description"
          label={t('common:description')}
          initialValue={initialDocumentCategory.description}
          >
          <MarkdownInput preview minRows={5} />
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
