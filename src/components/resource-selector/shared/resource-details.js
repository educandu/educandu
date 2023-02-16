import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import React, { useState } from 'react';
import ResourceUrl from './resource-url.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../../utils/url-utils.js';
import ResourcePreview from './resource-preview.js';
import { useService } from '../../container-context.js';
import mimeTypeHelper from '../../../ui/mime-type-helper.js';
import { RESOURCE_TYPE } from '../../../domain/constants.js';
import { usePercentageFormat } from '../../locale-context.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../../utils/source-utils.js';
import { formatMediaPosition } from '../../../utils/media-utils.js';

function ResourceDetails({ size, url, previewOnly }) {
  const { t } = useTranslation();
  const clientConfig = useService(ClientConfig);
  const formatPercentage = usePercentageFormat();
  const [resourceData, setResourceData] = useState({ resourceType: RESOURCE_TYPE.none });

  const accessibleUrl = getAccessibleUrl({ url, cdnRootUrl: clientConfig.cdnRootUrl });
  const fileName = decodeURIComponent(urlUtils.getFileName(accessibleUrl));
  const category = mimeTypeHelper.getCategory(fileName);

  return (
    <div className="ResourceDetails">
      {!previewOnly && (
        <div className="ResourceDetails-file">
          <div className="ResourceDetails-fileName">{fileName}</div>
        </div>
      )}

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
        </div>
      </div>

      {!previewOnly && <ResourceUrl url={url} />}
    </div>
  );
}

ResourceDetails.propTypes = {
  size: PropTypes.number,
  url: PropTypes.string.isRequired,
  previewOnly: PropTypes.bool
};

ResourceDetails.defaultProps = {
  size: null,
  previewOnly: false
};

export default ResourceDetails;
