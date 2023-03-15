import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useIsMounted } from '../../../ui/hooks.js';
import ResourceDetails from '../shared/resource-details.js';
import { cdnObjectShape } from '../../../ui/default-prop-types.js';

function RoomMediaPreviewModal({ isOpen, file, onClose }) {
  const { t } = useTranslation();
  const isMounted = useIsMounted();

  return !!isMounted.current && (
    <Modal
      forceRender
      open={isOpen}
      footer={null}
      closable={false}
      maskClosable={false}
      title={t('common:preview')}
      onCancel={onClose}
      >
      <div className="RoomMediaPreviewModal">
        <div className="RoomMediaPreviewModal-preview">
          {!!file && <ResourceDetails url={file.url} size={file.size} />}
        </div>
        <div className="RoomMediaPreviewModal-buttons">
          <Button type="primary" onClick={onClose}>{t('common:ok')}</Button>
        </div>
      </div>
    </Modal>
  );
}

RoomMediaPreviewModal.propTypes = {
  file: cdnObjectShape,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired
};

RoomMediaPreviewModal.defaultProps = {
  file: null,
  isOpen: false
};

export default RoomMediaPreviewModal;
