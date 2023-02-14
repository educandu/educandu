import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Divider } from 'antd';
import reactDropzoneNs from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useRef } from 'react';
import ActionInvitation from './action-invitation.js';
import { SOURCE_TYPE } from '../../../domain/constants.js';
import SelectedResourceDisplay from './selected-resource-display.js';
import { CloudUploadOutlined, SearchOutlined } from '@ant-design/icons';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

function NoSearch({ sourceType, url, onFileDrop }) {
  const dropzoneRef = useRef();
  const { t } = useTranslation('noSearch');

  let canDropFile;
  let searchInvitationHeader;

  switch (sourceType) {
    case SOURCE_TYPE.mediaLibrary:
      canDropFile = true;
      searchInvitationHeader = t('searchInvitationHeaderForMediaLibrary');
      break;
    case SOURCE_TYPE.wikimedia:
      canDropFile = false;
      searchInvitationHeader = t('searchInvitationHeaderForWikimedia');
      break;
    default:
      throw new Error(`Invalid source type '${sourceType}'`);
  }

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const handleFileDrop = files => {
    canDropFile && files.length && onFileDrop(files[0]);
  };

  const getContentContainerClasses = isDragActive => classNames({
    'NoSearch-contentContainer': true,
    'NoSearch-contentContainer--canDrop': canDropFile,
    'is-drag-active': canDropFile && isDragActive
  });

  return (
    <div className="NoSearch">
      <ReactDropzone
        ref={dropzoneRef}
        onDrop={handleFileDrop}
        noKeyboard
        noClick
        >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div {...getRootProps({ className: getContentContainerClasses(isDragActive) })}>
            <input {...getInputProps()} hidden />
            {!!url && (
              <SelectedResourceDisplay
                urlOrFile={url}
                footer={t('initialFilePreviewFooter')}
                />
            )}
            {!url && (
              <ActionInvitation
                icon={<SearchOutlined />}
                title={searchInvitationHeader}
                subtitle={t('searchInvitationDescription')}
                />
            )}
            {!!canDropFile && (
              <Fragment>
                <div className="NoSearch-divider">
                  <Divider plain>{t('common:or')}</Divider>
                </div>
                <ActionInvitation
                  icon={<CloudUploadOutlined />}
                  title={url ? t('common:dropDifferentFileInvitation') : t('common:dropFileInvitation')}
                  subtitle={(
                    <Button
                      type="primary"
                      onClick={handleUploadButtonClick}
                      >
                      {t('common:browseFilesButtonLabel')}
                    </Button>
                  )}
                  />
              </Fragment>
            )}
          </div>
        )}
      </ReactDropzone>
    </div>
  );
}

NoSearch.propTypes = {
  sourceType: PropTypes.oneOf([SOURCE_TYPE.mediaLibrary, SOURCE_TYPE.wikimedia]).isRequired,
  url: PropTypes.string,
  onFileDrop: PropTypes.func
};

NoSearch.defaultProps = {
  url: null,
  onFileDrop: () => {}
};

export default NoSearch;
