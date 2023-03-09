import { Button } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ImageEditor from '../../image-editor.js';
import React, { useRef, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { confirmExitFileEditor } from '../../confirmation-dialogs.js';

function FileEditorScreen({ file, onBackClick, onCancelClick, onApplyClick }) {
  const { t } = useTranslation('fileEditorScreen');
  const imageEditorRef = useRef(null);
  const [fileIsDirty, setFileIsDirty] = useState(false);

  const handleImageEditorCrop = ({ isCropped }) => {
    setFileIsDirty(isCropped);
  };

  const handleApplyChanges = async () => {
    const newFile = await imageEditorRef.current.getCroppedFile();
    onApplyClick(newFile);
  };

  const handleBackClick = () => {
    if (fileIsDirty) {
      confirmExitFileEditor(t, onBackClick);
    } else {
      onBackClick();
    }
  };

  return (
    <div className="u-resource-selector-screen">
      <h3 className="u-resource-selector-screen-headline">{t('headline')}</h3>
      <div className="u-resource-selector-screen-content">
        <div className="FileEditorScreen">
          <ImageEditor
            file={file}
            editorRef={imageEditorRef}
            onCrop={handleImageEditorCrop}
            />
        </div>
      </div>
      <div className="u-resource-selector-screen-footer">
        <Button onClick={handleBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" disabled={!fileIsDirty} onClick={handleApplyChanges}>{t('applyChanges')}</Button>
        </div>
      </div>
    </div>
  );
}

FileEditorScreen.propTypes = {
  file: PropTypes.object.isRequired,
  onApplyClick: PropTypes.func.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired
};

export default FileEditorScreen;
