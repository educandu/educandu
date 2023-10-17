import classNames from 'classnames';
import { Form, Upload } from 'antd';
import prettyBytes from 'pretty-bytes';
import reactDropzoneNs from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useRef } from 'react';
import uniqueId from '../../utils/unique-id.js';
import Markdown from '../../components/markdown.js';
import { CloudUploadOutlined } from '@ant-design/icons';
import EmptyState from '../../components/empty-state.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../domain/constants.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;
const FormItem = Form.Item;

export default function FileUploadFieldDisplay({ context, content, input, canModifyInput, onInputChanged }) {
  const dropzoneRef = useRef();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('fileUploadField');

  const { isPreview } = context;
  const { data, files } = input;
  const { label, maxCount, width } = content;

  const maximumAddableFiles = Math.max(0, maxCount - files.length);
  const canAcceptFiles = !isPreview && canModifyInput && maximumAddableFiles > 0;

  const fileList = useMemo(() => files.map(file => ({
    uid: file.key,
    name: file.name,
    status: 'done',
    url: getAccessibleUrl({ url: file.url, cdnRootUrl: clientConfig.cdnRootUrl })
  })), [files, clientConfig]);

  const handleChange = ({ file }) => {
    if (file.status === 'removed') {
      onInputChanged(data, { removeFiles: [file.uid] });
    }
  };

  const handleFileDrop = newFiles => {
    const filesToAdd = newFiles.filter((_file, index) => index < maximumAddableFiles).map(file => {
      file.uid = uniqueId.create();
      return [file.uid, file];
    });
    onInputChanged(data, { addFiles: filesToAdd });
  };

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const getDropzoneClasses = isDragActive => classNames(
    'FileUploadFieldDisplay-dropzone',
    { 'is-dropping': isDragActive && canAcceptFiles },
    { 'is-drop-rejected': isDragActive && !canAcceptFiles }
  );

  return (
    <div className={`FileUploadFieldDisplay u-horizontally-centered u-width-${width}`}>
      <Form layout="vertical">
        <FormItem label={label ? <Markdown inline>{label}</Markdown> : null}>
          {!!canModifyInput && (
            <ReactDropzone ref={dropzoneRef} noClick noKeyboard onDrop={canAcceptFiles ? handleFileDrop : null}>
              {({ getRootProps, getInputProps, isDragActive }) => (
                <div {...getRootProps({ className: getDropzoneClasses(isDragActive) })}>
                  <input {...getInputProps()} hidden />
                  <EmptyState
                    icon={<CloudUploadOutlined />}
                    title={maxCount === 1 ? t('common:mediaUploadEmptyStateTitle') : t('common:mediaUploadMultipleEmptyStateTitle')}
                    subtitle={maxCount === 1 ? t('common:mediaUploadEmptyStateSubtitle') : t('common:mediaUploadMultipleEmptyStateSubtitle')}
                    button={{
                      isDefaultType: true,
                      isDisabled: !canAcceptFiles,
                      text: t('common:browse'),
                      subtext: t('common:uploadLimitInfo', { limit: prettyBytes(STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES), maxFiles: maxCount }),
                      onClick: handleUploadButtonClick
                    }}
                    />
                </div>
              )}
            </ReactDropzone>
          )}
          <Upload
            multiple
            listType="picture"
            maxCount={maxCount}
            fileList={fileList}
            onChange={handleChange}
            disabled={!canModifyInput}
            />
        </FormItem>
      </Form>
    </div>
  );
}

FileUploadFieldDisplay.propTypes = {
  ...sectionDisplayProps
};
