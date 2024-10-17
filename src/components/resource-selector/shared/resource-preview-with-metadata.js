import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import React, { useState } from 'react';
import ResourceUrl from './resource-url.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../../utils/url-utils.js';
import ResourcePreview from './resource-preview.js';
import mimeTypeHelper from '../../../ui/mime-type-helper.js';
import { RESOURCE_TYPE } from '../../../domain/constants.js';
import { usePercentageFormat } from '../../locale-context.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { formatMediaPosition } from '../../../utils/media-utils.js';

function ResourcePreviewWithMetadata({ urlOrFile, size, showName, showUrl }) {
  const { t } = useTranslation();
  const formatPercentage = usePercentageFormat();
  const [resourceData, setResourceData] = useState({ resourceType: RESOURCE_TYPE.none });

  const fileName = urlOrFile instanceof File ? urlOrFile.name : decodeURIComponent(urlUtils.getFileName(urlOrFile));
  const fileUrl = urlOrFile instanceof File ? urlOrFile.url : urlOrFile;
  const category = mimeTypeHelper.getCategory(fileName);

  return (
    <div className="ResourcePreviewWithMetadata u-resource-selector-screen-content-rows">
      {!!showName && (
        <div className="u-resource-selector-screen-file-name">{fileName}</div>
      )}

      <div className="ResourcePreviewWithMetadata-preview">
        <ResourcePreview urlOrFile={urlOrFile} onResourceLoad={setResourceData} />
        <div className="ResourcePreviewWithMetadata-metadata">
          <div>{mimeTypeHelper.localizeCategory(category, t)}</div>
          {typeof size === 'number' && (
            <div>{prettyBytes(size)}</div>
          )}
          {resourceData.resourceType === RESOURCE_TYPE.image && (
            <div>{resourceData.width}&nbsp;x&nbsp;{resourceData.height}&nbsp;px</div>
          )}
          {(resourceData.resourceType === RESOURCE_TYPE.audio || resourceData.resourceType === RESOURCE_TYPE.video) && (
            <div>
              {formatMediaPosition({ position: 1, duration: resourceData.durationInMilliseconds, formatPercentage })}
            </div>
          )}
        </div>
      </div>

      {!!showUrl && <ResourceUrl url={fileUrl} />}
    </div>
  );
}

ResourcePreviewWithMetadata.propTypes = {
  size: PropTypes.number,
  showName: PropTypes.bool,
  showUrl: PropTypes.bool,
  urlOrFile: PropTypes.oneOfType([
    PropTypes.string,
    browserFileType
  ]).isRequired,
};

ResourcePreviewWithMetadata.defaultProps = {
  size: null,
  showName: false,
  showUrl: false
};

export default ResourcePreviewWithMetadata;
