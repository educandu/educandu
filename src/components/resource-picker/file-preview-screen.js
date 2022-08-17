import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import FilePreview from '../file-preview.js';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined } from '@ant-design/icons';

function FilePreviewScreen({ file, onBack, onCancel, onSelect }) {
  const { t } = useTranslation('');

  return (
    <div className="ResourcePicker-screen">
      <div className="ResourcePicker-screenContent">
        <FilePreview
          url={file.url}
          size={file.size}
          createdOn={file.createdOn}
          />
      </div>
      <div className="ResourcePicker-screenFooter">
        <Button onClick={onBack} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
        <div className="ResourcePicker-screenFooterButtons">
          <Button onClick={onCancel}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={onSelect}>{t('common:select')}</Button>
        </div>
      </div>
    </div>
  );
}

FilePreviewScreen.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string,
    size: PropTypes.string,
    createdOn: PropTypes.string
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default FilePreviewScreen;
