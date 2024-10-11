import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import reactDropzoneNs from 'react-dropzone';
import EmptyState from '../../empty-state.js';
import { Trans, useTranslation } from 'react-i18next';
import { useService } from '../../container-context.js';
import { CloudUploadOutlined } from '@ant-design/icons';
import { FILE_UPLOAD_STATUS } from '../shared/constants.js';
import React, { Fragment, useEffect, useState } from 'react';
import ClientConfig from '../../../bootstrap/client-config.js';
import FilesUploadViewer from '../shared/files-upload-viewer.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

function MediaLibraryFileDropzone({ dropzoneRef, uploadItems, canAcceptFiles, uploadLimit, onFilesDrop, onEditImageClick }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaLibraryFileDropzone');

  // move this up into the parent to not loose selection when returning from edit screen
  const [previewedItemIndex, setPreviewedItemIndex] = useState(uploadItems.length ? 0 : -1);

  useEffect(() => {
    setPreviewedItemIndex(uploadItems.length ? 0 : -1);
  }, [uploadItems]);

  const handleUploadButtonClick = () => {
    if (canAcceptFiles) {
      dropzoneRef.current.open();
    }
  };

  const handleItemClick = itemIndex => {
    setPreviewedItemIndex(itemIndex);
  };

  const handleEditItemClick = itemIndex => {
    onEditImageClick(itemIndex);
  };

  const getPreviewAreaClasses = isDragActive => classNames(
    'MediaLibraryFileDropzone',
    { 'MediaLibraryFileDropzone--error': !!uploadItems.some(item => item.errorMessage) },
    { 'is-dropping': canAcceptFiles && isDragActive },
    { 'is-drop-rejected': !canAcceptFiles && isDragActive }
  );

  return (
    <ReactDropzone ref={dropzoneRef} onDrop={onFilesDrop} noKeyboard noClick>
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div {...getRootProps({ className: getPreviewAreaClasses(isDragActive) })}>
          <div className="MediaLibraryFileDropzone-content">
            <input {...getInputProps()} hidden />
            {!!uploadItems.length && (
              <div>
                <div className="MediaLibraryFileDropzone-title">{t('common:mediaFilesSelectedForUpload', { fileCount: uploadItems.length })}</div>
                <FilesUploadViewer
                  uploadItems={uploadItems}
                  previewedItemIndex={previewedItemIndex}
                  editingDisabled={!canAcceptFiles}
                  verticalMode
                  onEditItemClick={handleEditItemClick}
                  onItemClick={handleItemClick}
                  />
              </div>
            )}
            {!uploadItems.length && (
              <EmptyState
                compact
                icon={<CloudUploadOutlined />}
                title={uploadItems.length ? t('common:mediaUploadAlternativeTitle') : t('common:mediaUploadEmptyStateTitle')}
                subtitle={t('common:mediaUploadEmptyStateSubtitle')}
                button={{
                  isDefaultType: true,
                  text: t('common:browse'),
                  subtext: (
                    <Fragment>
                      {t('common:uploadLimitInfo', { limit: uploadLimit ? prettyBytes(uploadLimit) : 'none', maxFiles: 1 })}
                      {!!uploadLimit && !!clientConfig.adminEmailAddress && (
                        <Fragment>
                          <br />
                          <Trans
                            t={t}
                            i18nKey="common:uploadLimitAdminContactInfo"
                            components={[<a key="email-link" href={`mailto:${encodeURIComponent(clientConfig.adminEmailAddress)}`} />]}
                            />
                        </Fragment>
                      )}
                    </Fragment>
                  ),
                  onClick: handleUploadButtonClick
                }}
                />
            )}
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
  uploadItems: PropTypes.arrayOf(PropTypes.shape({
    file: PropTypes.object.isRequired,
    isEditable: PropTypes.bool.isRequired,
    status: PropTypes.oneOf(Object.values(FILE_UPLOAD_STATUS)),
    errorMessage: PropTypes.string
  })).isRequired,
  canAcceptFiles: PropTypes.bool,
  uploadLimit: PropTypes.number,
  onFilesDrop: PropTypes.func.isRequired,
  onEditImageClick: PropTypes.func.isRequired
};

MediaLibraryFileDropzone.defaultProps = {
  canAcceptFiles: true,
  uploadLimit: null
};

export default MediaLibraryFileDropzone;
