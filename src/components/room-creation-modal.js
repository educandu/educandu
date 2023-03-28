
import { Modal } from 'antd';
import PropTypes from 'prop-types';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import RoomMetadataForm from './room-metadata-form.js';
import { handleApiError } from '../ui/error-helper.js';
import React, { useState, useRef, useEffect } from 'react';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const logger = new Logger(import.meta.url);

function RoomCreationModal({ isOpen, onClose }) {
  const formRef = useRef(null);
  const { t } = useTranslation('roomCreationModal');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [loading, setLoading] = useState(false);

  const defaultRoom = {
    name: t('newRoom'),
    slug: '',
    shortDescription: '',
    isCollaborative: false
  };

  useEffect(() => {
    if (isOpen && formRef.current) {
      formRef.current.resetFields();
    }
  }, [isOpen]);

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleFormSubmitted = async ({ name, slug, isCollaborative, shortDescription }) => {
    try {
      setLoading(true);
      const newRoom = await roomApiClient.addRoom({ name, slug, isCollaborative, shortDescription });
      setLoading(false);
      onClose();

      window.location = routes.getRoomUrl(newRoom._id, newRoom.slug);
    } catch (error) {
      handleApiError({ error, logger, t });
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
      open={isOpen}
      okButtonProps={{ loading }}
      >
      <div className="u-modal-body">
        <RoomMetadataForm formRef={formRef} room={defaultRoom} onSubmit={handleFormSubmitted} />
      </div>
    </Modal>
  );
}

RoomCreationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RoomCreationModal;
