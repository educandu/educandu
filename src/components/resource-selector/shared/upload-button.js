import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { useTranslation } from 'react-i18next';
import UploadIcon from '../../icons/general/upload-icon.js';
import { ORIENTATION, STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';

export const UPLOAD_BUTTON_INTENT = {
  upload: 'upload',
  browse: 'browse'
};

function UploadButton({ intent, orientation, ...buttonProps }) {
  const { t } = useTranslation();
  const defaultButtonProps = intent === UPLOAD_BUTTON_INTENT.upload
    ? { children: t('common:upload'), icon: <UploadIcon /> }
    : { children: t('common:browse') };
  return (
    <span className={`UploadButton UploadButton--${orientation}`}>
      <Button {...defaultButtonProps} {...buttonProps} />
      <span className="UploadButton-uploadLimitInfo">{t('common:uploadLimitInfo', { limit: prettyBytes(STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES) })}</span>
    </span>
  );
}

UploadButton.propTypes = {
  intent: PropTypes.oneOf(Object.values(UPLOAD_BUTTON_INTENT)).isRequired,
  orientation: PropTypes.oneOf(Object.values(ORIENTATION)).isRequired
};

export default UploadButton;
