import React, { useMemo } from 'react';
import { Button, Form, Upload } from 'antd';
import { useTranslation } from 'react-i18next';
import { UploadOutlined } from '@ant-design/icons';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const FormItem = Form.Item;

export default function FileUploadFieldDisplay({ content, input, canModifyInput, onInputChanged }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('fileUploadField');

  const { label, maxCount, width } = content;
  const { data, files } = input;

  const fileList = useMemo(() => files.map(file => ({
    uid: file.key,
    name: file.name,
    status: 'done',
    url: getAccessibleUrl({ url: file.url, cdnRootUrl: clientConfig.cdnRootUrl })
  })), [files, clientConfig]);

  const handleChange = ({ file }) => {
    if (file.status === 'removed') {
      onInputChanged(data, { removeFiles: [file.uid] });
    } else if (files.length < maxCount) {
      onInputChanged(data, { addFiles: [[file.uid, file]] });
    }
  };

  const handleBeforeUpload = () => {
    return false;
  };

  const uploadButton = (
    <Button icon={<UploadOutlined />} disabled={files.length >= maxCount}>{t('common:upload')}</Button>
  );

  return (
    <div className={`u-horizontally-centered u-width-${width}`}>
      <Form layout="vertical">
        <FormItem label={label ? <Markdown inline>{label}</Markdown> : null}>
          <Upload
            multiple
            listType="picture"
            maxCount={maxCount}
            fileList={fileList}
            onChange={handleChange}
            disabled={!canModifyInput}
            beforeUpload={handleBeforeUpload}
            >
            {uploadButton}
          </Upload>
        </FormItem>
      </Form>
    </div>
  );
}

FileUploadFieldDisplay.propTypes = {
  ...sectionDisplayProps
};
