
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { Form, Modal, Input, Radio } from 'antd';
import inputValidators from '../utils/input-validators.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import React, { useState, useRef, useEffect } from 'react';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const logger = new Logger(import.meta.url);

function RoomCreationModal({ isVisible, onClose }) {
  const formRef = useRef(null);
  const { t } = useTranslation('roomCreationModal');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [loading, setLoading] = useState(false);

  const defaultRoom = {
    name: t('newRoom'),
    slug: '',
    access: ROOM_ACCESS_LEVEL.private
  };

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

  useEffect(() => {
    if (isVisible && formRef.current) {
      formRef.current.resetFields();
    }
  }, [isVisible]);

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleOnFinish = async ({ name, slug, access }) => {
    try {
      setLoading(true);
      const newRoom = await roomApiClient.addRoom({ name, slug, access });
      setLoading(false);
      onClose();

      window.location = urls.getRoomUrl(newRoom._id);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      setLoading(false);
    }
  };

  const handleCancel = () => onClose();

  return (
    <Modal
      title={t('newRoom')}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      visible={isVisible}
      okButtonProps={{ loading }}
      >
      <Form onFinish={handleOnFinish} name="new-room-form" ref={formRef} layout="vertical">
        <FormItem label={t('common:name')} name="name" rules={nameValidationRules} initialValue={defaultRoom.name}>
          <Input />
        </FormItem>
        <FormItem label={t('common:slug')} name="slug" rules={slugValidationRules} initialValue={defaultRoom.slug}>
          <Input />
        </FormItem>
        <FormItem label={t('common:access')} name="access" initialValue={defaultRoom.access}>
          <RadioGroup>
            <RadioButton value={ROOM_ACCESS_LEVEL.private}>{t('common:accessType_private')}</RadioButton>
            <RadioButton value={ROOM_ACCESS_LEVEL.public}>{t('common:accessType_public')}</RadioButton>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>
  );
}

RoomCreationModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RoomCreationModal;
