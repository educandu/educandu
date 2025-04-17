import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import DebouncedInput from './debounced-input.js';
import { useService } from './container-context.js';
import { MediaLibraryIcon } from './icons/icons.js';
import { SOURCE_TYPE } from '../domain/constants.js';
import ClientConfig from '../bootstrap/client-config.js';
import PrivateIcon from './icons/general/private-icon.js';
import { analyzeMediaUrl } from '../utils/media-utils.js';
import WikimediaIcon from './icons/wikimedia/wikimedia-icon.js';
import ResourceSelectorDialog from './resource-selector/resource-selector-dialog.js';
import { GlobalOutlined, WarningOutlined, YoutubeOutlined } from '@ant-design/icons';
import { getSourceType, getPortableUrl, getAccessibleUrl } from '../utils/source-utils.js';

function UrlInput({ value, allowedSourceTypes, disabled, onChange }) {
  const { t } = useTranslation('urlInput');
  const clientConfig = useService(ClientConfig);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        return <MediaLibraryIcon />;
      case SOURCE_TYPE.roomMedia:
        return <PrivateIcon />;
      case SOURCE_TYPE.external:
        return unsecureUrl ? <WarningOutlined /> : <GlobalOutlined />;
      default:
        return <WarningOutlined />;
    }
  }, [sourceType, unsecureUrl]);

  const handleInputValueChange = (newValue, sanitize) => {
    let url = getAccessibleUrl({ url: newValue, cdnRootUrl: clientConfig.cdnRootUrl });

    if (sanitize) {
      const { sanitizedUrl } = analyzeMediaUrl(url);
      url = sanitizedUrl;
    }

    url = getPortableUrl({ url, cdnRootUrl: clientConfig.cdnRootUrl });
    if (value !== url) {
      onChange(url);
    }
  };

  const handleDebouncedInputValueChange = event => {
    handleInputValueChange(event.target.value, false);
  };

  const handleInputBlur = event => {
    handleInputValueChange(event.target.value, true);
  };

  const handleSelectButtonClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogSelect = newUrl => {
    handleInputValueChange(newUrl, true);
    setIsDialogOpen(false);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const renderInputPrefix = () => {
    const classes = classNames(
      'UrlInput-prefix',
      { 'UrlInput-prefix--error': sourceType === SOURCE_TYPE.unsupported },
      { 'UrlInput-prefix--warning': unsecureUrl }
    );

    return (
      <Tooltip title={t(`tooltip_${sourceType}`)}>
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
        onBlur={handleInputBlur}
        addonBefore={renderInputPrefix()}
        onChange={handleDebouncedInputValueChange}
        />
      <Button
        type="primary"
        disabled={disabled}
        onClick={handleSelectButtonClick}
        >
        {t('common:select')}
      </Button>
      {!!unsecureUrl && (
        <div className="UrlInput-warning">{t('unsecureUrl')}</div>
      )}
      <ResourceSelectorDialog
        url={value}
        isOpen={isDialogOpen}
        allowedSourceTypes={allowedSourceTypes}
        onSelect={handleDialogSelect}
        onClose={handleDialogClose}
        />
    </div>
  );
}

UrlInput.propTypes = {
  allowedSourceTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SOURCE_TYPE))),
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.string
};

UrlInput.defaultProps = {
  allowedSourceTypes: Object.values(SOURCE_TYPE),
  disabled: false,
  onChange: () => {},
  value: ''
};

export default UrlInput;
