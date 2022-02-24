import PropTypes from 'prop-types';
import { Form, Modal } from 'antd';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import EmailFormItem from './email-form-item.js';
import React, { useEffect, useState } from 'react';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const logger = new Logger(import.meta.url);

function RoomInvitationCreationModal({ isVisible, onOk, onCancel, roomId }) {
  const [form] = Form.useForm();
  const { t } = useTranslation('roomInvitationCreationModal');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  useEffect(() => {
    if (!isVisible) {
      form.resetFields();
    }
  }, [form, isVisible]);

  const initialFormValues = { email: null };
  const [isLoading, setIsLoading] = useState(false);

  const handleFormFinish = async values => {
    try {
      setIsLoading(true);
      const invitation = await roomApiClient.addRoomInvitation({ email: values.email, roomId });
      onOk(invitation);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalCancel = () => {
    onCancel();
  };

  const handleModalOk = () => {
    form.submit();
  };

  return (
    <Modal
      title={t('newRoomInvitation')}
      onCancel={handleModalCancel}
      onOk={handleModalOk}
      maskClosable={false}
      visible={isVisible}
      okButtonProps={{ loading: isLoading }}
      forceRender
      >
      <Form form={form} name="new-room-invitation-form" initialValues={initialFormValues} onFinish={handleFormFinish} layout="vertical">
        <EmailFormItem name="email" />
      </Form>
    </Modal>
  );
}

RoomInvitationCreationModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired
};

export default RoomInvitationCreationModal;
