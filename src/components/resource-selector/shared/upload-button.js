import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { useTranslation } from 'react-i18next';
import UploadIcon from '../../icons/general/upload-icon.js';
import { STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';

function UploadButton({ maxFiles, ...buttonProps }) {
  const { t } = useTranslation();

  return (
    <span className="UploadButton">
      <Button icon={<UploadIcon />} {...buttonProps}>{t('common:upload')}</Button>
      <span className="UploadButton-uploadLimitInfo">{t('common:uploadLimitInfo', { limit: prettyBytes(STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES), maxFiles })}</span>
    </span>
  );
}

UploadButton.propTypes = {
  maxFiles: PropTypes.number
};

UploadButton.defaultProps = {
  maxFiles: 1
};

export default UploadButton;
