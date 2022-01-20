
import React from 'react';
import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { Form, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import inputValidators from '../utils/input-validators.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import { roomMetadataShape } from '../ui/default-prop-types.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const logger = new Logger(import.meta.url);

function RoomMetadataForm({ room, formRef, onSubmit }) {
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
      validator: (rule, value) => {
        return value && !inputValidators.isValidSlug(value)
          ? Promise.reject(new Error(t('common:invalidSlug')))
          : Promise.resolve();
      }
    }
  ];

  const handleOnFinish = async ({ name, slug, access }) => {
    try {
      await onSubmit({ name, slug, access });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  return (
    <Form onFinish={handleOnFinish} name="room-metadata-form" ref={formRef} layout="vertical">
      <FormItem label={t('common:name')} name="name" rules={nameValidationRules} initialValue={room.name}>
        <Input />
      </FormItem>
      <FormItem label={t('common:slug')} name="slug" rules={slugValidationRules} initialValue={room.slug}>
        <Input />
      </FormItem>
      <FormItem label={t('common:access')} name="access" initialValue={room.access}>
        <RadioGroup>
          <RadioButton value={ROOM_ACCESS_LEVEL.private}>{t('common:accessType_private')}</RadioButton>
          <RadioButton value={ROOM_ACCESS_LEVEL.public}>{t('common:accessType_public')}</RadioButton>
        </RadioGroup>
      </FormItem>
    </Form>
  );
}

RoomMetadataForm.propTypes = {
  formRef: PropTypes.shape({
    current: PropTypes.object
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  room: roomMetadataShape.isRequired
};

export default RoomMetadataForm;
