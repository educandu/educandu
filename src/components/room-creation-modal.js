
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { Form, Modal, Input, Radio } from 'antd';
import inputValidators from '../utils/input-validators.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import React, { useState, useRef, useEffect, useCallback } from 'react';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const logger = new Logger(import.meta.url);

function RoomCreationModal({ isVisible, onClose }) {
  const formRef = useRef(null);
  const { t } = useTranslation('roomCreationModal');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

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

  const isFormValid = async () => {
    try {
      await formRef.current.validateFields(['name, slug'], { force: true });
      return true;
    } catch {
      return false;
    }
  };

  const createRoomState = useCallback(() => ({
    name: t('newRoom'),
    slug: '',
    access: ROOM_ACCESS_LEVEL.private
  }), [t]);

  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(createRoomState());

  useEffect(() => {
    if (isVisible) {
      const newRoom = createRoomState();
      setRoom(newRoom);

      if (formRef.current) {
        formRef.current.setFieldsValue({ name: newRoom.name });
        formRef.current.setFieldsValue({ slug: newRoom.slug });
      }
    }
  }, [isVisible, createRoomState]);

  const handleOk = async () => {
    try {
      const isValid = await isFormValid();
      if (!isValid) {
        return;
      }

      setLoading(true);
      const newRoom = await roomApiClient.addRoom({ name: room.name, slug: room.slug, access: room.access });
      setLoading(false);
      onClose();

      window.location = urls.getRoomUrl(newRoom._id);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      setLoading(false);
    }
  };

  const handleCancel = () => onClose();

  const handleNameChange = event => {
    const { value } = event.target;
    setRoom(prevState => ({ ...prevState, name: value }));
  };

  const handleSlugChange = event => {
    const { value } = event.target;
    setRoom(prevState => ({ ...prevState, slug: value }));
  };

  const handleAccessChange = event => {
    const { value } = event.target;
    setRoom(prevState => ({ ...prevState, access: value }));
  };

  return (
    <Modal
      title={t('newRoom')}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      visible={isVisible}
      okButtonProps={{ loading }}
      >
      <Form name="new-room-form" ref={formRef} layout="vertical">
        <FormItem label={t('common:name')} name="name" rules={nameValidationRules} initialValue={room.name}>
          <Input onChange={handleNameChange} />
        </FormItem>
        <FormItem label={t('common:slug')} name="slug" rules={slugValidationRules} initialValue={room.slug}>
          <Input onChange={handleSlugChange} />
        </FormItem>
        <FormItem label={t('common:access')}>
          <RadioGroup value={room.access} onChange={handleAccessChange}>
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
