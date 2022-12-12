import React from 'react';
import Info from './info.js';
import PropTypes from 'prop-types';
import { Form, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './markdown-input.js';
import inputValidators from '../utils/input-validators.js';
import { ROOM_DOCUMENTS_MODE } from '../domain/constants.js';
import { roomMetadataProps } from '../ui/default-prop-types.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const editModeFormInputLayouts = {
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

  const handleFinish = async ({ name, slug, documentsMode, description }) => {
    await onSubmit({ name, slug, documentsMode, description });
  };

  const handleFieldsChange = async (...args) => {
    await onFieldsChange(...args);
  };

  const formInputsLayouts = editMode ? editModeFormInputLayouts : {};

  return (
    <Form onFinish={handleFinish} onFieldsChange={handleFieldsChange} name="room-metadata-form" ref={formRef} layout="vertical">
      <FormItem label={t('common:name')} name="name" rules={nameValidationRules} initialValue={room.name} {...formInputsLayouts}>
        <Input />
      </FormItem>
      <FormItem label={t('common:slug')} name="slug" rules={slugValidationRules} initialValue={room.slug} {...formInputsLayouts}>
        <Input />
      </FormItem>
      <FormItem
        name="documentsMode"
        initialValue={room.documentsMode}
        label={<Info tooltip={t('documentsModeInfo')} iconAfterContent>{t('common:documentsMode')}</Info>}
        >
        <RadioGroup>
          <RadioButton value={ROOM_DOCUMENTS_MODE.exclusive}>{t('common:documentsMode_exclusive')}</RadioButton>
          <RadioButton value={ROOM_DOCUMENTS_MODE.collaborative}>{t('common:documentsMode_collaborative')}</RadioButton>
        </RadioGroup>
      </FormItem>
      {!!editMode && (
        <FormItem label={t('common:description')} name="description" initialValue={room.description}>
          <MarkdownInput preview />
        </FormItem>
      )}
    </Form>
  );
}

const roomMetadataFormShape = {
  ...roomMetadataProps,
  _id: PropTypes.string
};

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
  room: PropTypes.shape(roomMetadataFormShape).isRequired
};

export default RoomMetadataForm;
