import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { useTranslation } from 'react-i18next';
import UploadIcon from '../../icons/general/upload-icon.js';

function UploadButton({ maxFiles, uploadLimit, ...buttonProps }) {
  const { t } = useTranslation();

  return (
    <span className="UploadButton">
      <Button icon={<UploadIcon />} {...buttonProps}>{t('common:upload')}</Button>
      <span className="UploadButton-uploadLimitInfo">
        {t('common:uploadLimitInfo', { limit: uploadLimit ? prettyBytes(uploadLimit) : 'none', maxFiles })}
      </span>
    </span>
  );
}

UploadButton.propTypes = {
  maxFiles: PropTypes.number,
  uploadLimit: PropTypes.number
};

UploadButton.defaultProps = {
  maxFiles: 1,
  uploadLimit: null
};

export default UploadButton;
