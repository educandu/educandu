import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { message, Tooltip } from 'antd';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useState } from 'react';
import urlUtils from '../../../utils/url-utils.js';
import ResourcePreview from './resource-preview.js';
import LiteralUrlLink from '../../literal-url-link.js';
import { useService } from '../../container-context.js';
import { handleError } from '../../../ui/error-helper.js';
import mimeTypeHelper from '../../../ui/mime-type-helper.js';
import { RESOURCE_TYPE } from '../../../domain/constants.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../../utils/source-utils.js';
import { formatMediaPosition } from '../../../utils/media-utils.js';
import { useDateFormat, usePercentageFormat } from '../../locale-context.js';
import CopyToClipboardIcon from '../../icons/general/copy-to-clipboard-icon.js';

const logger = new Logger(import.meta.url);

function ResourceDetails({ createdOn, updatedOn, size, url }) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
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

  const renderDetails = () => {
    return (
      <Fragment>
        <div className="ResourceDetails-detailLabel">
          {t('common:name')}
        </div>
        <div className="ResourceDetails-detailValue">
          {fileName}
        </div>
        <div className="ResourceDetails-detailLabel">
          {t('common:type')}
        </div>
        <div className="ResourceDetails-detailValue">
          {mimeTypeHelper.localizeCategory(category, t)}
        </div>
        {typeof size === 'number' && (
          <Fragment>
            <div className="ResourceDetails-detailLabel">
              {t('common:size')}
            </div>
            <div className="ResourceDetails-detailValue">
              {prettyBytes(size)}
            </div>
          </Fragment>
        )}
        {!!createdOn && (
          <Fragment>
            <div className="ResourceDetails-detailLabel">
              {t('common:createdOn')}
            </div>
            <div className="ResourceDetails-detailValue">
              {formatDate(createdOn)}
            </div>
          </Fragment>
        )}
        {!!updatedOn && (
          <Fragment>
            <div className="ResourceDetails-detailLabel">
              {t('common:updatedOn')}
            </div>
            <div className="ResourceDetails-detailValue">
              {formatDate(updatedOn)}
            </div>
          </Fragment>
        )}
        {resourceData.resourceType === RESOURCE_TYPE.image && (
          <Fragment>
            <div className="ResourceDetails-detailLabel">
              {t('common:naturalSize')}
            </div>
            <div className="ResourceDetails-detailValue">
              {resourceData.width}&nbsp;⨉&nbsp;{resourceData.height}&nbsp;px
            </div>
          </Fragment>
        )}
        {(resourceData.resourceType === RESOURCE_TYPE.audio || resourceData.resourceType === RESOURCE_TYPE.video) && (
          <Fragment>
            <div className="ResourceDetails-detailLabel">
              {t('common:duration')}
            </div>
            <div className="ResourceDetails-detailValue">
              {formatMediaPosition({ position: 1, duration: resourceData.durationInMilliseconds, formatPercentage })}
            </div>
          </Fragment>
        )}
        {resourceData.resourceType === RESOURCE_TYPE.pdf && (
          <Fragment>
            <div className="ResourceDetails-detailLabel">
              {t('common:pageCount')}
            </div>
            <div className="ResourceDetails-detailValue">
              {resourceData.numPages}
            </div>
          </Fragment>
        )}
        <div className="ResourceDetails-detailLabel">
          {t('common:url')}
          &nbsp;&nbsp;
          <Tooltip title={t('common:copyUrlToClipboard')}>
            <a onClick={handleCopyUrlToClipboardClick}><CopyToClipboardIcon /></a>
          </Tooltip>
        </div>
        <div className="ResourceDetails-detailValue">
          <LiteralUrlLink href={accessibleUrl} targetBlank />
        </div>
      </Fragment>
    );
  };

  return (
    <div className="ResourceDetails">
      <div className="ResourceDetails-previewArea">
        <ResourcePreview urlOrFile={accessibleUrl} onResourceLoad={setResourceData} />
      </div>
      <div className="ResourceDetails-detailsArea">
        {renderDetails()}
      </div>
    </div>
  );
}

ResourceDetails.propTypes = {
  createdOn: PropTypes.string,
  size: PropTypes.number,
  updatedOn: PropTypes.string,
  url: PropTypes.string.isRequired
};

ResourceDetails.defaultProps = {
  createdOn: null,
  size: null,
  updatedOn: null
};

export default ResourceDetails;
