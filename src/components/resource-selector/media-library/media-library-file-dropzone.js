import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import { Button, Divider } from 'antd';
import React, { Fragment } from 'react';
import reactDropzoneNs from 'react-dropzone';
import EmptyState from '../../empty-state.js';
import { Trans, useTranslation } from 'react-i18next';
import { useService } from '../../container-context.js';
import { CloudUploadOutlined } from '@ant-design/icons';
import WarningIcon from '../../icons/general/warning-icon.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { isEditableImageFile } from '../../../utils/storage-utils.js';
import SelectedResourceDisplay from '../shared/selected-resource-display.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

function MediaLibraryFileDropzone({ dropzoneRef, file, canAcceptFile, uploadLimit, showSizeWarning, onFileDrop, onEditImageClick }) {
  const clientConfig = useService(ClientConfig);
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
                      {!!showSizeWarning && !!uploadLimit && (
                        <div className="MediaLibraryFileDropzone-sizeWarning">
                          <WarningIcon />
                          {t('common:fileIsTooBig', { limit: prettyBytes(uploadLimit) })}
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
  uploadLimit: PropTypes.number,
  showSizeWarning: PropTypes.bool,
  onFileDrop: PropTypes.func.isRequired,
  onEditImageClick: PropTypes.func.isRequired
};

MediaLibraryFileDropzone.defaultProps = {
  file: null,
  canAcceptFile: true,
  uploadLimit: null,
  showSizeWarning: false
};

export default MediaLibraryFileDropzone;
