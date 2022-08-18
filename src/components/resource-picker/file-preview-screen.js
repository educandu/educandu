import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import FilePreview from '../file-preview.js';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { fileShape } from '../../ui/default-prop-types.js';

function FilePreviewScreen({ file, onBackClick, onCancelClick, onSelectClick }) {
  const { t } = useTranslation('filePreviewScreen');

  return (
    <div className="ResourcePickerScreen">
      <h3>{t('headline')}</h3>
      <div className="ResourcePickerScreen-content ResourcePickerScreen-content--centered ResourcePickerScreen-content--scrollable">
        <FilePreview url={file.url} size={file.size} createdOn={file.createdOn} />
      </div>
      <div className="ResourcePickerScreen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
        <div className="ResourcePickerScreen-footerButtons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={onSelectClick}>{t('common:select')}</Button>
        </div>
      </div>
    </div>
  );
}

FilePreviewScreen.propTypes = {
  file: fileShape.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onSelectClick: PropTypes.func.isRequired
};

export default FilePreviewScreen;
