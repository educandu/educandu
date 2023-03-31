import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import { Button, Divider } from 'antd';
import React, { Fragment } from 'react';
import reactDropzoneNs from 'react-dropzone';
import EmptyState from '../../empty-state.js';
import { useTranslation } from 'react-i18next';
import { CloudUploadOutlined } from '@ant-design/icons';
import WarningIcon from '../../icons/general/warning-icon.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { isEditableImageFile } from '../../../utils/storage-utils.js';
import SelectedResourceDisplay from '../shared/selected-resource-display.js';
import { STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

function MediaLibraryFileDropzone({ dropzoneRef, file, canAcceptFile, showSizeWarning, onFileDrop, onEditImageClick }) {
  const { t } = useTranslation('mediaLibraryFileDropzone');

  const canEditImage = file && isEditableImageFile(file);

  const handleUploadButtonClick = () => {
    if (canAcceptFile) {
      dropzoneRef.current.open();
    }
  };

  const getPreviewAreaClasses = isDragActive => classNames(
    'MediaLibraryFileDropzone',
    { 'MediaLibraryFileDropzone--warning': showSizeWarning },
    { 'is-dropping': canAcceptFile && isDragActive },
    { 'is-drop-rejected': !canAcceptFile && isDragActive }
  );

  return (
    <ReactDropzone ref={dropzoneRef} onDrop={onFileDrop} noKeyboard noClick>
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div {...getRootProps({ className: getPreviewAreaClasses(isDragActive) })}>
          <div className="MediaLibraryFileDropzone-content">
            <input {...getInputProps()} hidden />
            {!!file && (
              <Fragment>
                <SelectedResourceDisplay
                  urlOrFile={file}
                  footer={(
                    <Fragment>
                      {!showSizeWarning && (
                        <div>{t('fileWillBeAddedToMediaLibrary')}</div>
                      )}
                      {!!showSizeWarning && (
                        <div className="MediaLibraryFileDropzone-sizeWarning">
                          <WarningIcon />
                          {t('common:fileIsTooBig', { limit: prettyBytes(STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES) })}
                        </div>
                      )}
                      {!!canEditImage && (
                        <div className="MediaLibraryFileDropzone-contentButton">
                          <Button onClick={onEditImageClick}>
                            {t('common:edit')}
                          </Button>
                        </div>
                      )}
                    </Fragment>
                  )}
                  />
                <div className="MediaLibraryFileDropzone-divider">
                  <Divider plain>{t('common:or')}</Divider>
                </div>
              </Fragment>
            )}
            <EmptyState
              compact
              icon={<CloudUploadOutlined />}
              title={file ? t('common:mediaUploadAlternativeTitle') : t('common:mediaUploadEmptyStateTitle')}
              subtitle={t('common:mediaUploadEmptyStateSubtitle')}
              button={{
                isDefaultType: true,
                text: t('common:browse'),
                onClick: handleUploadButtonClick
              }}
              />
          </div>
        </div>
      )}
    </ReactDropzone>
  );
}

MediaLibraryFileDropzone.propTypes = {
  dropzoneRef: PropTypes.shape({
    current: PropTypes.object
  }).isRequired,
  file: browserFileType,
  canAcceptFile: PropTypes.bool,
  showSizeWarning: PropTypes.bool,
  onFileDrop: PropTypes.func.isRequired,
  onEditImageClick: PropTypes.func.isRequired
};

MediaLibraryFileDropzone.defaultProps = {
  file: null,
  canAcceptFile: true,
  showSizeWarning: false
};

export default MediaLibraryFileDropzone;
