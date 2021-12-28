import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { Form, Modal, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { useService } from './container-context.js';
import React, { useState, useRef, useEffect } from 'react';
import RoomApiClient from '../api-clients/room-api-client.js';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

function RoomInvitationCreationModal({ isVisible, onClose, roomId }) {
  const formRef = useRef(null);
  const roomApiClient = useService(RoomApiClient);
  const { t } = useTranslation('roomInvitationCreationModal');

  const emailValidationRules = [
    {
      required: true,
      message: t('emailRequired'),
      whitespace: true
    }
  ];

  const isFormValid = async () => {
    try {
      await formRef.current.validateFields(['email'], { force: true });
      return true;
    } catch {
      return false;
    }
  };

  const [state, setState] = useState({
    loading: false,
    email: null
  });

  useEffect(() => {
    if (isVisible) {
      setState(prevState => ({ ...prevState, email: null }));

      if (formRef.current) {
        formRef.current.setFieldsValue({ email: null });
      }
    }
  }, [isVisible]);

  const handleOk = async () => {
    try {
      const isValid = await isFormValid();
      if (!isValid) {
        return;
      }

      setState(prevState => ({ ...prevState, loading: true }));
      await roomApiClient.addRoomInvitation({ email: state.email, roomId });
      onClose(true);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setState(prevState => ({ ...prevState, loading: false }));
    }
  };

  const handleCancel = () => onClose(false);

  const handleEmailChange = event => {
    const { value } = event.target;
    setState(prevState => ({ ...prevState, email: value }));
  };

  return (
    <Modal
      title={t('newRoomInvitation')}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      visible={isVisible}
      okButtonProps={{ loading: state.loading }}
      >
      <Form name="new-room-invitation-form" ref={formRef} layout="vertical">
        <FormItem label={t('common:email')} name="email" rules={emailValidationRules}>
          <Input onChange={handleEmailChange} />
        </FormItem>
      </Form>
    </Modal>
  );
}

RoomInvitationCreationModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired
};

export default RoomInvitationCreationModal;
