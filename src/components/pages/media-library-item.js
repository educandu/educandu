import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import React, { useState } from 'react';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import { RESOURCE_TYPE } from '../../domain/constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { formatMediaPosition } from '../../utils/media-utils.js';
import ResourceUrl from '../resource-selector/shared/resource-url.js';
import { mediaLibraryItemShape } from '../../ui/default-prop-types.js';
import ResourcePreview from '../resource-selector/shared/resource-preview.js';
import LanguageDataProvider from '../../localization/language-data-provider.js';
import { useDateFormat, useLocale, usePercentageFormat } from '../locale-context.js';

function MediaLibraryItem({ initialState, PageTemplate }) {
  const { uiLanguage } = useLocale();
  const { formatDate } = useDateFormat();
  const clientConfig = useService(ClientConfig);
  const formatPercentage = usePercentageFormat();
  const { t } = useTranslation('mediaLibraryItem');
  const languageDataProvider = useService(LanguageDataProvider);

  const [resourceData, setResourceData] = useState({ resourceType: RESOURCE_TYPE.none });

  const { mediaLibraryItem } = initialState;

  const hasDimensions = resourceData.resourceType === RESOURCE_TYPE.image;
  const hasDuration = resourceData.resourceType === RESOURCE_TYPE.audio || resourceData.resourceType === RESOURCE_TYPE.video;
  const hasUpdateDate = mediaLibraryItem.createdOn !== mediaLibraryItem.updatedOn;

  const accessibleUrl = getAccessibleUrl({ url: mediaLibraryItem.url, cdnRootUrl: clientConfig.cdnRootUrl });
  const createdByProfileUrl = routes.getUserProfileUrl(mediaLibraryItem.createdBy._id);
  const updatedByProfileUrl = routes.getUserProfileUrl(mediaLibraryItem.updatedBy._id);

  const languageNames = mediaLibraryItem.languages
    .map(language => {
      const { name } = languageDataProvider.getLanguageData(language, uiLanguage);
      return name;
    }).join(', ');

  return (
    <PageTemplate>
      <div className="MediaLibraryItemPage">
        <div className="MediaLibraryItemPage-title">{t('title')}</div>
        <div className="MediaLibraryItemPage-resource">
          <ResourcePreview urlOrFile={accessibleUrl} fullWidth onResourceLoad={setResourceData} />
        </div>
        <div className="MediaLibraryItemPage-info">
          <div className="MediaLibraryItemPage-infoName">{mediaLibraryItem.name}</div>
          <div className="MediaLibraryItemPage-infoDescription">{mediaLibraryItem.shortDescription}</div>

          <div className="MediaLibraryItemPage-infoSections">
            <div className="MediaLibraryItemPage-infoSection">
              <div>{t('common:size')}:</div>
              <div>{prettyBytes(mediaLibraryItem.size)}</div>
            </div>
            {!!hasDimensions && (
              <div className="MediaLibraryItemPage-infoSection">
                <div>{t('common:size')}:</div>
                <div>{resourceData.width}&nbsp;⨉&nbsp;{resourceData.height}&nbsp;px</div>
              </div>
            )}
            {!!hasDuration && (
              <div className="MediaLibraryItemPage-infoSection">
                <div>{t('common:duration')}:</div>
                {formatMediaPosition({ position: 1, duration: resourceData.durationInMilliseconds, formatPercentage })}
              </div>
            )}
            <div className="MediaLibraryItemPage-infoSection">
              <div>{t('created')}:</div>
              <div>
                {formatDate(mediaLibraryItem.createdOn)}, <a href={createdByProfileUrl}>{mediaLibraryItem.createdBy.displayName}</a>
              </div>
            </div>
            {!!hasUpdateDate && (
              <div className="MediaLibraryItemPage-infoSection">
                <div>{t('updated')}:</div>
                <div>
                  {formatDate(mediaLibraryItem.updatedOn)}, <a href={updatedByProfileUrl}>{mediaLibraryItem.updatedBy.displayName}</a>
                </div>
              </div>
            )}
            {!!languageNames && (
              <div className="MediaLibraryItemPage-infoSection">
                <div>{t('common:languages')}:</div>
                <div>{languageNames}</div>
              </div>
            )}
            <div className="MediaLibraryItemPage-infoSection">
              <div>{t('common:licenses')}:</div>
              {!mediaLibraryItem.allRightsReserved && (
                <div>{mediaLibraryItem.licenses.join(', ')}</div>
              )}
              {!!mediaLibraryItem.allRightsReserved && (
                <div>{t('common:allRightsReserved')}</div>
              )}
            </div>
            <div className="MediaLibraryItemPage-infoSection">
              <div>{t('common:tags')}:</div>
              <div>{mediaLibraryItem.tags.join(', ')}</div>
            </div>
          </div>

          <ResourceUrl url={mediaLibraryItem.url} />
        </div>
      </div>
    </PageTemplate>
  );
}

MediaLibraryItem.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    mediaLibraryItem: mediaLibraryItemShape
  }).isRequired
};

export default MediaLibraryItem;
