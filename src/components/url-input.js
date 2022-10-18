import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Input, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import { SOURCE_TYPE } from '../domain/constants.js';
import PublicIcon from './icons/general/public-icon.js';
import { getSourceType } from '../utils/media-utils.js';
import ClientConfig from '../bootstrap/client-config.js';
import PrivateIcon from './icons/general/private-icon.js';
import ResourcePicker from './resource-picker/resource-picker.js';
import { GlobalOutlined, WarningOutlined, YoutubeOutlined } from '@ant-design/icons';
import { ensurePortableUrlIfStorageUrl, storageLocationPathToUrl } from '../utils/storage-utils.js';

function UrlInput({ sourceUrl, onChange }) {
  const { t } = useTranslation('urlInput');
  const clientConfig = useService(ClientConfig);

  const sourceType = useMemo(
    () => getSourceType({ sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    , [clientConfig.cdnRootUrl, sourceUrl]
  );

  const inputPrefixIcon = useMemo(() => {
    switch (sourceType) {
      case SOURCE_TYPE.none:
        return null;
      case SOURCE_TYPE.youtube:
        return <YoutubeOutlined />;
      case SOURCE_TYPE.internalPublic:
        return <PublicIcon />;
      case SOURCE_TYPE.internalPrivate:
        return <PrivateIcon />;
      case SOURCE_TYPE.external:
        return <GlobalOutlined />;
      default:
        return <WarningOutlined />;
    }
  }, [sourceType]);

  const handleUrlChange = selectedPortableUrl => {
    onChange({ sourceUrl: selectedPortableUrl, sourceType });
  };

  const handleInputValueChange = event => {
    onChange({ sourceUrl: event.target.value, sourceType });
  };

  const handleInputBlur = () => {
    const url = ensurePortableUrlIfStorageUrl({ sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    onChange({ sourceUrl: url, sourceType });
  };

  const renderInputPrefix = () => {
    return (
      <Tooltip title={t(`tooltip_${sourceType}`)}>
        <div className={classNames('UrlInput-prefix', { 'UrlInput-prefix--error': sourceType === SOURCE_TYPE.unsupported })}>
          {inputPrefixIcon}
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="UrlInput u-input-and-button">
      <Input
        value={sourceUrl}
        addonBefore={renderInputPrefix()}
        onChange={handleInputValueChange}
        onBlur={handleInputBlur}
        />
      <ResourcePicker
        url={storageLocationPathToUrl(sourceUrl)}
        onUrlChange={url => handleUrlChange(url)}
        />
    </div>
  );
}

UrlInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  sourceUrl: PropTypes.string
};

UrlInput.defaultProps = {
  sourceUrl: ''
};

export default UrlInput;
