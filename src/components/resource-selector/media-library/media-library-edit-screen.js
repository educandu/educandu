import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../../utils/url-utils.js';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useService } from '../../container-context.js';
import ResourceDetails from '../shared/resource-details.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../../utils/source-utils.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';

function MediaLibraryEditScreen({
  file,
  onBackClick,
  onCancelClick,
  onSaveClick
}) {
  const [form] = Form.useForm();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaLibraryEditScreen');

  const handleSaveClick = () => {
    form.submit();
  };

  const renderFileName = () => {
    const accessibleUrl = getAccessibleUrl({ url: file.url, cdnRootUrl: clientConfig.cdnRootUrl });
    return decodeURIComponent(urlUtils.getFileName(accessibleUrl));
  };

  return (
    <div className="u-resource-selector-screen">
      <h3 className="u-resource-selector-screen-headline">{t('editHeadline')}</h3>
      <div className="u-overflow-auto">
        <div className="u-resource-selector-screen-content-rows">
          <div className="u-resource-selector-screen-file-name">{renderFileName()}</div>
          <div className="u-resource-selector-screen-content-split">
            <ResourceDetails url={file.url} size={file.size} previewOnly />
            <MediaLibraryMetadataForm form={form} file={file} useOptimizeImage={false} onFinish={onSaveClick} />
          </div>
        </div>
      </div>
      <div className="u-resource-selector-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick} >{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleSaveClick}>{t('common:save')}</Button>
        </div>
      </div>
    </div>
  );
}

MediaLibraryEditScreen.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    description: PropTypes.string,
    languages: PropTypes.arrayOf(PropTypes.string),
    licenses: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onBackClick: PropTypes.func,
  onSaveClick: PropTypes.func,
  onCancelClick: PropTypes.func
};

MediaLibraryEditScreen.defaultProps = {
  onBackClick: () => {},
  onSaveClick: () => {},
  onCancelClick: () => {}
};

export default MediaLibraryEditScreen;
