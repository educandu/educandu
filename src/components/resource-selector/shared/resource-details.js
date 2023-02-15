import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { message, Tooltip } from 'antd';
import React, { useState } from 'react';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../../utils/url-utils.js';
import ResourcePreview from './resource-preview.js';
import LiteralUrlLink from '../../literal-url-link.js';
import { useService } from '../../container-context.js';
import { handleError } from '../../../ui/error-helper.js';
import mimeTypeHelper from '../../../ui/mime-type-helper.js';
import { RESOURCE_TYPE } from '../../../domain/constants.js';
import { usePercentageFormat } from '../../locale-context.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../../utils/source-utils.js';
import { formatMediaPosition } from '../../../utils/media-utils.js';
import CopyToClipboardIcon from '../../icons/general/copy-to-clipboard-icon.js';

const logger = new Logger(import.meta.url);

function ResourceDetails({ size, url }) {
  const { t } = useTranslation();
  const clientConfig = useService(ClientConfig);
  const formatPercentage = usePercentageFormat();
  const [resourceData, setResourceData] = useState({ resourceType: RESOURCE_TYPE.none });

  const accessibleUrl = getAccessibleUrl({ url, cdnRootUrl: clientConfig.cdnRootUrl });
  const fileName = decodeURIComponent(urlUtils.getFileName(accessibleUrl));
  const category = mimeTypeHelper.getCategory(fileName);

  const handleCopyUrlToClipboardClick = async event => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await window.navigator.clipboard.writeText(accessibleUrl);
      message.success(t('common:urlCopiedToClipboard'));
    } catch (error) {
      handleError({ message: t('common:copyUrlToClipboardError'), error, logger, t, duration: 30 });
    }
  };

  return (
    <div className="ResourceDetails">
      <div className="ResourceDetails-file">
        <div className="ResourceDetails-fileName">{fileName}</div>
      </div>

      <div className="ResourceDetails-previewArea">
        <ResourcePreview urlOrFile={accessibleUrl} onResourceLoad={setResourceData} />
        <div className="ResourceDetails-fileMetadata">
          <div>{mimeTypeHelper.localizeCategory(category, t)}</div>
          {typeof size === 'number' && (
          <div>{prettyBytes(size)}</div>
          )}
          {resourceData.resourceType === RESOURCE_TYPE.image && (
          <div>{resourceData.width}&nbsp;⨉&nbsp;{resourceData.height}&nbsp;px</div>
          )}
          {(resourceData.resourceType === RESOURCE_TYPE.audio || resourceData.resourceType === RESOURCE_TYPE.video) && (
          <div>
            {formatMediaPosition({ position: 1, duration: resourceData.durationInMilliseconds, formatPercentage })}
          </div>
          )}
          {resourceData.resourceType === RESOURCE_TYPE.pdf && (
          <div>{resourceData.numPages}</div>
          )}
        </div>
      </div>

      <div className="ResourceDetails-link">
        <Tooltip title={t('common:copyUrlToClipboard')}>
          <a onClick={handleCopyUrlToClipboardClick}>
            <div className="ResourceDetails-linkIcon"><CopyToClipboardIcon /></div>
          </a>
        </Tooltip>
        <LiteralUrlLink href={accessibleUrl} targetBlank />
      </div>
    </div>
  );
}

ResourceDetails.propTypes = {
  size: PropTypes.number,
  url: PropTypes.string.isRequired
};

ResourceDetails.defaultProps = {
  size: null
};

export default ResourceDetails;
