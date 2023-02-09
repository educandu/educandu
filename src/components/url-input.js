import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DebouncedInput from './debounced-input.js';
import { useService } from './container-context.js';
import { SOURCE_TYPE } from '../domain/constants.js';
import PublicIcon from './icons/general/public-icon.js';
import ClientConfig from '../bootstrap/client-config.js';
import PrivateIcon from './icons/general/private-icon.js';
import { analyzeMediaUrl } from '../utils/media-utils.js';
import WikimediaIcon from './icons/wikimedia/wikimedia-icon.js';
import ResourcePicker from './resource-picker/resource-picker.js';
import { BankOutlined, GlobalOutlined, WarningOutlined, YoutubeOutlined } from '@ant-design/icons';
import { getSourceType, getPortableUrl, getAccessibleUrl, createMetadataForSource } from '../utils/source-utils.js';

function UrlInput({ value, allowedSourceTypes, disabled, onChange }) {
  const { t } = useTranslation('urlInput');
  const clientConfig = useService(ClientConfig);

  const unsecureUrl = value && value.startsWith('http://');

  const sourceType = useMemo(() => {
    const newSourceType = getSourceType({ url: value, cdnRootUrl: clientConfig.cdnRootUrl });
    return allowedSourceTypes.includes(newSourceType) ? newSourceType : SOURCE_TYPE.unsupported;
  }, [clientConfig.cdnRootUrl, value, allowedSourceTypes]);

  const inputPrefixIcon = useMemo(() => {
    switch (sourceType) {
      case SOURCE_TYPE.none:
        return null;
      case SOURCE_TYPE.youtube:
        return <YoutubeOutlined />;
      case SOURCE_TYPE.wikimedia:
        return <WikimediaIcon />;
      case SOURCE_TYPE.mediaLibrary:
        return <BankOutlined />;
      case SOURCE_TYPE.documentMedia:
        return <PublicIcon />;
      case SOURCE_TYPE.roomMedia:
        return <PrivateIcon />;
      case SOURCE_TYPE.external:
        return unsecureUrl ? <WarningOutlined /> : <GlobalOutlined />;
      default:
        return <WarningOutlined />;
    }
  }, [sourceType, unsecureUrl]);

  const handleInputValueChange = newValue => {
    const accessibleUrl = getAccessibleUrl({ url: newValue, cdnRootUrl: clientConfig.cdnRootUrl });
    const { sanitizedUrl } = analyzeMediaUrl(accessibleUrl);
    const portableUrl = getPortableUrl({ url: sanitizedUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    const metadata = createMetadataForSource({ url: portableUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    onChange(portableUrl, metadata);
  };

  const handleDebouncedInputValueChange = event => {
    handleInputValueChange(event.target.value);
  };

  const renderInputPrefix = () => {
    const tooltipTitle = `${t('common:source')}: ${t(`tooltip_${sourceType}`)}`;
    const classes = classNames(
      'UrlInput-prefix',
      { 'UrlInput-prefix--error': sourceType === SOURCE_TYPE.unsupported },
      { 'UrlInput-prefix--warning': unsecureUrl }
    );

    return (
      <Tooltip title={tooltipTitle}>
        <div className={classes}>
          {inputPrefixIcon}
        </div>
      </Tooltip>
    );
  };

  const classes = classNames(
    'UrlInput',
    'u-input-and-button',
    { 'UrlInput--warning': unsecureUrl }
  );

  return (
    <div className={classes}>
      <DebouncedInput
        value={value}
        disabled={disabled}
        addonBefore={renderInputPrefix()}
        onChange={handleDebouncedInputValueChange}
        />
      <ResourcePicker
        url={value}
        disabled={disabled}
        allowedSourceTypes={allowedSourceTypes}
        onUrlChange={handleInputValueChange}
        />
      {!!unsecureUrl && (
        <div className="UrlInput-warning">{t('unsecureUrl')}</div>
      )}
    </div>
  );
}

UrlInput.propTypes = {
  allowedSourceTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SOURCE_TYPE))),
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string
};

UrlInput.defaultProps = {
  allowedSourceTypes: Object.values(SOURCE_TYPE),
  disabled: false,
  value: ''
};

export default UrlInput;
