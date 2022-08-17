import { Button } from 'antd';
import PropTypes from 'prop-types';
import ImageEditor from '../image-editor.js';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { fileShape } from '../../ui/default-prop-types.js';
import { confirmExitFileEditor } from '../confirmation-dialogs.js';
import { IMAGE_OPTIMIZATION_QUALITY, IMAGE_OPTIMIZATION_THRESHOLD_WIDTH } from '../../domain/constants.js';

function FileEditorScreen({ file, onBack, onCancel, onApply }) {
  const { t } = useTranslation('');
  const imageEditorRef = useRef(null);
  const [fileIsDirty, setFileIsDirty] = useState(false);

  const handleImageEditorCrop = ({ isCropped }) => {
    setFileIsDirty(isCropped);
  };

  const handleApplyChanges = async () => {
    const newFile = await imageEditorRef.current.getCroppedFile(IMAGE_OPTIMIZATION_THRESHOLD_WIDTH, IMAGE_OPTIMIZATION_QUALITY);
    onApply(newFile);
  };

  const handleBackClick = () => {
    if (fileIsDirty) {
      confirmExitFileEditor(t, onBack);
    } else {
      onBack();
    }
  };

  return (
    <div className="ResourcePickerScreen">
      <div className="ResourcePickerScreen-content">
        <div className="FileEditorScreen">
          <div className="FileEditorScreen-image">
            <ImageEditor
              file={file}
              editorRef={imageEditorRef}
              onCrop={handleImageEditorCrop}
              />
          </div>
        </div>
      </div>
      <div className="ResourcePickerScreen-footer">
        <Button onClick={handleBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
        <div className="ResourcePickerScreen-footerButtons">
          <Button onClick={onCancel}>{t('common:cancel')}</Button>
          <Button type="primary" disabled={!fileIsDirty} onClick={handleApplyChanges}>{t('common:applyChanges')}</Button>
        </div>
      </div>
    </div>
  );
}

FileEditorScreen.propTypes = {
  file: fileShape.isRequired,
  onApply: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default FileEditorScreen;
