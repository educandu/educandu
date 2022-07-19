
import { Modal } from 'antd';
import PropTypes from 'prop-types';
import urls from '../utils/routes.js';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import RoomMetadataForm from './room-metadata-form.js';
import React, { useState, useRef, useEffect } from 'react';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { ROOM_ACCESS, ROOM_LESSONS_MODE } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

function RoomCreationModal({ isVisible, onClose }) {
  const formRef = useRef(null);
  const { t } = useTranslation('roomCreationModal');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [loading, setLoading] = useState(false);

  const defaultRoom = {
    name: t('newRoom'),
    slug: '',
    access: ROOM_ACCESS.private,
    lessonsMode: ROOM_LESSONS_MODE.exclusive
  };

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

  const handleFormSubmitted = async ({ name, slug, access, lessonsMode }) => {
    try {
      setLoading(true);
      const newRoom = await roomApiClient.addRoom({ name, slug, access, lessonsMode });
      setLoading(false);
      onClose();

      window.location = urls.getRoomUrl(newRoom._id, newRoom.slug);
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
      <RoomMetadataForm formRef={formRef} room={defaultRoom} onSubmit={handleFormSubmitted} />
    </Modal>
  );
}

RoomCreationModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RoomCreationModal;
