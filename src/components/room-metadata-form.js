import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownTextarea from './markdown-textarea.js';
import inputValidators from '../utils/input-validators.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import { roomMetadataShape } from '../ui/default-prop-types.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const formInputLayouts = {
  labelCol: { xs: { span: 12 }, sm: { span: 12 } },
  wrapperCol: { xs: { span: 12 }, sm: { span: 12 } }
};

function RoomMetadataForm({ room, editMode, formRef, onFieldsChange, onSubmit }) {
  const { t } = useTranslation('roomMetadataForm');

  const nameValidationRules = [
    {
      required: true,
      message: t('roomNameRequired'),
      whitespace: true
    }
  ];

  const slugValidationRules = [
    {
      validator: (_rule, value) => {
        return value && !inputValidators.isValidSlug(value)
          ? Promise.reject(new Error(t('common:invalidSlug')))
          : Promise.resolve();
      }
    }
  ];

  const handleFinish = async ({ name, slug, access, description }) => {
    await onSubmit({ name, slug, access, description });
  };

  const handleFieldsChange = async (...args) => {
    await onFieldsChange(...args);
  };

  return (
    <Form onFinish={handleFinish} onFieldsChange={handleFieldsChange} name="room-metadata-form" ref={formRef} layout="vertical">
      <FormItem label={t('common:name')} name="name" rules={nameValidationRules} initialValue={room.name} {...formInputLayouts}>
        <Input />
      </FormItem>
      <FormItem label={t('common:slug')} name="slug" rules={slugValidationRules} initialValue={room.slug} {...formInputLayouts}>
        <Input />
      </FormItem>
      <FormItem label={t('common:access')} name="access" initialValue={room.access}>
        <RadioGroup disabled={editMode}>
          <RadioButton value={ROOM_ACCESS_LEVEL.private}>{t('common:accessType_private')}</RadioButton>
          <RadioButton value={ROOM_ACCESS_LEVEL.public}>{t('common:accessType_public')}</RadioButton>
        </RadioGroup>
      </FormItem>
      {editMode && (
        <FormItem label={t('common:description')} name="description" initialValue={room.description}>
          <MarkdownTextarea />
        </FormItem>
      )}
    </Form>
  );
}

RoomMetadataForm.defaultProps = {
  editMode: false,
  onFieldsChange: () => {}
};

RoomMetadataForm.propTypes = {
  editMode: PropTypes.bool,
  formRef: PropTypes.shape({
    current: PropTypes.object
  }).isRequired,
  onFieldsChange: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  room: roomMetadataShape.isRequired
};

export default RoomMetadataForm;
