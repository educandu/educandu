import { Button } from 'antd';
import PropTypes from 'prop-types';
import ImageEditor from '../image-editor.js';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
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
    <div className="ResourcePicker-screen">
      <div className="ResourcePicker-screenContent">
        <div className="ResourcePicker-fileEditorImageContainer">
          <div className="ResourcePicker-fileEditorImage">
            <ImageEditor
              file={file}
              editorRef={imageEditorRef}
              onCrop={handleImageEditorCrop}
              />
          </div>
        </div>
      </div>
      <div className="ResourcePicker-screenFooter">
        <Button onClick={handleBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
        <div className="ResourcePicker-screenFooterButtons">
          <Button onClick={onCancel}>{t('common:cancel')}</Button>
          <Button type="primary" disabled={!fileIsDirty} onClick={handleApplyChanges}>{t('common:applyChanges')}</Button>
        </div>
      </div>
    </div>
  );
}

FileEditorScreen.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string,
    size: PropTypes.string,
    createdOn: PropTypes.string
  }).isRequired,
  onApply: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default FileEditorScreen;
