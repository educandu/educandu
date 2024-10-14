import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import React, { Fragment } from 'react';
import reactDropzoneNs from 'react-dropzone';
import EmptyState from '../../empty-state.js';
import { Trans, useTranslation } from 'react-i18next';
import { useService } from '../../container-context.js';
import { CloudUploadOutlined } from '@ant-design/icons';
import { FILE_UPLOAD_STATUS } from '../shared/constants.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import FilesUploadViewer from '../shared/files-upload-viewer.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

function MediaLibraryFilesDropzone({ dropzoneRef, uploadItems, canAcceptFiles, uploadLimit, previewedItemIndex, onPreviewItemClick, onFilesDrop, onEditImageClick }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaLibraryFilesDropzone');

  const handleUploadButtonClick = () => {
    if (canAcceptFiles) {
      dropzoneRef.current.open();
    }
  };

  const handleItemClick = itemIndex => {
    onPreviewItemClick(itemIndex);
  };

  const handleEditItemClick = itemIndex => {
    onEditImageClick(itemIndex);
  };

  const handleFilesDrop = fs => {
    if (!fs.length) {
      return;
    }
    const allowedFiles = !uploadLimit?.fileCount ? fs : fs.slice(0, uploadLimit.fileCount);
    onFilesDrop(allowedFiles);
  };

  const getPreviewAreaClasses = isDragActive => classNames(
    'MediaLibraryFilesDropzone',
    { 'MediaLibraryFilesDropzone--error': !!uploadItems.some(item => item.errorMessage) },
    { 'is-dropping': canAcceptFiles && isDragActive },
    { 'is-drop-rejected': !canAcceptFiles && isDragActive }
  );

  return (
    <ReactDropzone ref={dropzoneRef} onDrop={handleFilesDrop} noKeyboard noClick>
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div {...getRootProps({ className: getPreviewAreaClasses(isDragActive) })}>
          <div className="MediaLibraryFilesDropzone-content">
            <input {...getInputProps()} hidden />
            {!!uploadItems.length && (
              <div>
                <div className="MediaLibraryFilesDropzone-title">{t('common:mediaFilesSelectedForUpload', { fileCount: uploadItems.length })}</div>
                <FilesUploadViewer
                  uploadItems={uploadItems}
                  previewedItemIndex={previewedItemIndex}
                  editingDisabled={!canAcceptFiles}
                  compactMode
                  onEditItemClick={handleEditItemClick}
                  onItemClick={handleItemClick}
                  />
              </div>
            )}
            {!uploadItems.length && (
              <EmptyState
                compact
                icon={<CloudUploadOutlined />}
                title={uploadItems.length ? t('common:mediaUploadAlternativeTitle') : t('common:mediaUploadMultipleEmptyStateTitle')}
                subtitle={t('common:mediaUploadMultipleEmptyStateSubtitle')}
                button={{
                  isDefaultType: true,
                  text: t('common:browse'),
                  subtext: (
                    <Fragment>
                      {!uploadLimit && t('common:noUploadLimitInfo')}
                      {!!uploadLimit && t('common:uploadLimitInfo', { limit: prettyBytes(uploadLimit.sizeInBytes), maxFiles: uploadLimit.fileCount })}
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

MediaLibraryFilesDropzone.propTypes = {
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
  previewedItemIndex: PropTypes.number,
  uploadLimit: PropTypes.shape({
    sizeInBytes: PropTypes.number,
    fileCount: PropTypes.number
  }),
  onPreviewItemClick:PropTypes.func,
  onFilesDrop: PropTypes.func.isRequired,
  onEditImageClick: PropTypes.func.isRequired
};

MediaLibraryFilesDropzone.defaultProps = {
  canAcceptFiles: true,
  uploadLimit: null,
  previewedItemIndex: -1,
  onPreviewItemClick: () => {}
};

export default MediaLibraryFilesDropzone;
