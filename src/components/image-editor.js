import PropTypes from 'prop-types';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import DimensionsProvider from './dimensions-provider.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IMAGE_OPTIMIZATION_QUALITY, IMAGE_OPTIMIZATION_THRESHOLD_WIDTH } from '../domain/constants.js';
import {
  ColumnHeightOutlined,
  ColumnWidthOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SyncOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';

const DEFAULT_CROPPER_OPTIONS = {
  viewMode: 1,
  autoCropArea: 1
};

function ImageEditor({ file, editorRef, onCrop }) {
  const { t } = useTranslation('imageEditor');
  const onCropRef = useRef(null);
  const cropperImageRef = useRef(null);
  const cropperInstanceRef = useRef(null);
  const [cropperModule, setCropperModule] = useState(null);

  editorRef.current = {
    getCroppedFile: async (maxWidth = IMAGE_OPTIMIZATION_THRESHOLD_WIDTH, quality = IMAGE_OPTIMIZATION_QUALITY) => {
      const canvas = cropperInstanceRef.current.getCroppedCanvas({
        maxWidth,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => {
          result ? resolve(result) : reject(new Error('Image cannot be rendered'));
        }, file.type, quality);
      });
      return new File([blob], file.name, { type: file.type || 'image/png' });
    }
  };

  onCropRef.current = onCrop;

  const cleanUp = useCallback(() => {
    if (cropperImageRef.current) {
      const oldUrl = cropperImageRef.current.src;
      cropperImageRef.current.src = '';
      URL.revokeObjectURL(oldUrl);
    }
    if (cropperInstanceRef.current) {
      cropperInstanceRef.current.destroy();
      cropperInstanceRef.current = null;
    }
  }, [cropperInstanceRef, cropperImageRef]);

  useEffect(() => {
    import('cropperjs').then(setCropperModule);
    return () => cleanUp();
  }, [cleanUp]);

  useEffect(() => {
    if (!cropperModule) {
      return;
    }

    cleanUp();

    if (file) {
      const { default: Cropper } = cropperModule;
      cropperImageRef.current.src = URL.createObjectURL(file);
      cropperInstanceRef.current = new Cropper(cropperImageRef.current, {
        ...DEFAULT_CROPPER_OPTIONS,
        crop: () => {
          const imageData = cropperInstanceRef.current.getImageData();
          const cropData = cropperInstanceRef.current.getData(true);
          const eventData = {
            naturalHeight: imageData.naturalHeight || 0,
            naturalWidth: imageData.naturalWidth || 0,
            cropHeight: cropData.height || 0,
            cropWidth: cropData.width || 0,
            cropX: cropData.x || 0,
            cropY: cropData.y || 0,
            rotate: cropData.rotate || 0,
            scaleX: cropData.scaleX || 0,
            scaleY: cropData.scaleY || 0
          };

          const isUnchainged = eventData.naturalHeight === eventData.cropHeight
           && eventData.naturalWidth === eventData.cropWidth
           && eventData.cropX === 0
           && eventData.cropY === 0
           && eventData.rotate === 0
           && eventData.scaleX === 1
           && eventData.scaleY === 1;

          onCropRef.current?.({ ...eventData, isCropped: !isUnchainged });
        }
      });
    }
  }, [cropperModule, file, cropperInstanceRef, cropperImageRef, onCropRef, cleanUp]);

  const handleCropperAction = (action, ...args) => {
    const cropper = cropperInstanceRef.current;

    let resetSelection = false;
    switch (action) {
      case 'zoom':
      case 'rotate':
        if (DEFAULT_CROPPER_OPTIONS.viewMode > 0) {
          resetSelection = true;
        }
        break;
      case 'scaleX':
        args[0] *= cropper.getData().scaleX;
        break;
      case 'scaleY':
        args[0] *= cropper.getData().scaleY;
        break;
      default:
        break;
    }

    if (resetSelection) {
      cropper.clear();
    }

    cropper[action](...args);

    if (resetSelection) {
      cropper.crop();
    }
  };

  return (
    <div className="ImageEditor">
      <div className="ImageEditor-imageWrapper">
        <DimensionsProvider>
          {({ containerHeight }) => <img className="ImageEditor-image" ref={cropperImageRef} style={{ height: containerHeight }} />}
        </DimensionsProvider>
      </div>
      <div className="ImageEditor-controls">
        <Tooltip title={t('common:reset')}>
          <Button type="link" icon={<SyncOutlined />} onClick={() => handleCropperAction('reset')} />
        </Tooltip>
        <Tooltip title={t('zoomIn')}>
          <Button type="link" icon={<ZoomInOutlined />} onClick={() => handleCropperAction('zoom', 0.1)} />
        </Tooltip>
        <Tooltip title={t('zoomOut')}>
          <Button type="link" icon={<ZoomOutOutlined />} onClick={() => handleCropperAction('zoom', -0.1)} />
        </Tooltip>
        <Tooltip title={t('rotateRight')}>
          <Button type="link" icon={<RotateRightOutlined />} onClick={() => handleCropperAction('rotate', 90)} />
        </Tooltip>
        <Tooltip title={t('rotateLeft')}>
          <Button type="link" icon={<RotateLeftOutlined />} onClick={() => handleCropperAction('rotate', -90)} />
        </Tooltip>
        <Tooltip title={t('scaleX')}>
          <Button type="link" icon={<ColumnWidthOutlined />} onClick={() => handleCropperAction('scaleX', -1)} />
        </Tooltip>
        <Tooltip title={t('scaleY')}>
          <Button type="link" icon={<ColumnHeightOutlined />} onClick={() => handleCropperAction('scaleY', -1)} />
        </Tooltip>
      </div>
    </div>
  );
}

ImageEditor.propTypes = {
  editorRef: PropTypes.object.isRequired,
  file: PropTypes.object.isRequired,
  onCrop: PropTypes.func
};

ImageEditor.defaultProps = {
  onCrop: () => {}
};

export default ImageEditor;
