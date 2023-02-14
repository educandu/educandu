import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ResourceDetails from './resource-details.js';
import { ArrowLeftOutlined } from '@ant-design/icons';

function ResourcePreviewScreen({ file, onBackClick, onCancelClick, onSelectClick }) {
  const { t } = useTranslation('resourcePreviewScreen');

  return (
    <div className="u-resource-selector-screen">
      <h3>{t('headline')}</h3>
      <div className="u-resource-selector-screen-content u-resource-selector-screen-content-fit u-resource-selector-screen-content-scrollable">
        <ResourceDetails url={file.url} size={file.size} createdOn={file.createdOn || null} updatedOn={file.updatedOn || null} />
      </div>
      <div className="u-resource-selector-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={onSelectClick}>{t('common:select')}</Button>
        </div>
      </div>
    </div>
  );
}

ResourcePreviewScreen.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    createdOn: PropTypes.string,
    updatedOn: PropTypes.string
  }).isRequired,
  onBackClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onSelectClick: PropTypes.func.isRequired
};

export default ResourcePreviewScreen;
