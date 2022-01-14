
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { Form, Modal, Input, Radio } from 'antd';
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

  const roomNameValidationRules = [
    {
      required: true,
      message: t('roomNameRequired'),
      whitespace: true
    }
  ];

  const isFormValid = async () => {
    try {
      await formRef.current.validateFields(['name'], { force: true });
      return true;
    } catch {
      return false;
    }
  };

  const createRoomState = useCallback(() => ({
    name: t('newRoom'),
    access: ROOM_ACCESS_LEVEL.private
  }), [t]);

  const [state, setState] = useState({
    loading: false,
    room: createRoomState()
  });

  useEffect(() => {
    if (isVisible) {
      const room = createRoomState();
      setState(prevState => ({ ...prevState, room }));

      if (formRef.current) {
        formRef.current.setFieldsValue({ name: room.name });
      }
    }
  }, [isVisible, createRoomState]);

  const handleOk = async () => {
    try {
      const isValid = await isFormValid();
      if (!isValid) {
        return;
      }

      setState(prevState => ({ ...prevState, loading: true }));
      const room = await roomApiClient.addRoom({ name: state.room.name, access: state.room.access });
      setState(prevState => ({ ...prevState, loading: false }));
      onClose();

      window.location = urls.getRoomUrl(room._id);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      setState(prevState => ({ ...prevState, loading: false }));
    }
  };

  const handleCancel = () => onClose();

  const handleNameChange = event => {
    const { value } = event.target;
    setState(prevState => ({ ...prevState, room: { ...prevState.room, name: value } }));
  };

  const handleAccessChange = event => {
    const { value } = event.target;
    setState(prevState => ({ ...prevState, room: { ...prevState.room, access: value } }));
  };

  return (
    <Modal
      title={t('newRoom')}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      visible={isVisible}
      okButtonProps={{ loading: state.loading }}
      >
      <Form name="new-room-form" ref={formRef} layout="vertical">
        <FormItem label={t('common:name')} name="name" rules={roomNameValidationRules} initialValue={state.room.name}>
          <Input onChange={handleNameChange} />
        </FormItem>
        <FormItem label={t('common:access')}>
          <RadioGroup value={state.room.access} onChange={handleAccessChange}>
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
