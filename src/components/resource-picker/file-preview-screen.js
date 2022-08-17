import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import FilePreview from '../file-preview.js';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { fileShape } from '../../ui/default-prop-types.js';

function FilePreviewScreen({ file, onBack, onCancel, onSelect }) {
  const { t } = useTranslation('');

  return (
    <div className="ResourcePickerScreen">
      <div className="ResourcePickerScreen-content">
        <FilePreview
          url={file.url}
          size={file.size}
          createdOn={file.createdOn}
          />
      </div>
      <div className="ResourcePickerScreen-footer">
        <Button onClick={onBack} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
        <div className="ResourcePickerScreen-footerButtons">
          <Button onClick={onCancel}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={onSelect}>{t('common:select')}</Button>
        </div>
      </div>
    </div>
  );
}

FilePreviewScreen.propTypes = {
  file: fileShape.isRequired,
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default FilePreviewScreen;
