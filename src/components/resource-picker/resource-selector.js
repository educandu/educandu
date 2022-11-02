import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useStorage } from '../storage-context.js';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getSourceType } from '../../utils/source-utils.js';
import StorageLocationScreens from './storage-location-screens.js';
import WikimediaCommonsScreens from './wikimedia-commons-screens.js';
import { SOURCE_TYPE, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

const { TabPane } = Tabs;

function ResourceSelector({ allowedSourceTypes, initialUrl, onCancel, onSelect }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('resourceSelector');
  const { locations: availableStorageLocations } = useStorage();
  const [visibleSourceTypes, setVisibleSourceTypes] = useState([]);
  const [selectedSourceType, setSelectedSourceType] = useState(null);

  useEffect(() => {
    const newVisibleSourceTypes = allowedSourceTypes.filter(sourceType => {
      switch (sourceType) {
        case SOURCE_TYPE.internalPublic:
          return availableStorageLocations.some(location => location.type === STORAGE_LOCATION_TYPE.public);
        case SOURCE_TYPE.internalPrivate:
          return availableStorageLocations.some(location => location.type === STORAGE_LOCATION_TYPE.private);
        default:
          return true;
      }
    });

    setVisibleSourceTypes(newVisibleSourceTypes);

    setSelectedSourceType(oldSelectedSourceType => {
      const sourceTypeMatchedByInitialUrl = getSourceType({ url: initialUrl, cdnRootUrl: clientConfig.cdnRootUrl });
      const preferredInitialSourceType = SOURCE_TYPE.internalPrivate;
      const firstVisibleSourceType = newVisibleSourceTypes[0];

      const newSourceTypePriorityList = [
        oldSelectedSourceType,
        sourceTypeMatchedByInitialUrl,
        preferredInitialSourceType,
        firstVisibleSourceType
      ];

      return newSourceTypePriorityList.filter(sourceType => newVisibleSourceTypes.includes(sourceType))[0] || null;
    });
  }, [allowedSourceTypes, initialUrl, availableStorageLocations, clientConfig]);

  const handleSourceTypeTabChange = newSourceType => {
    setSelectedSourceType(newSourceType);
  };

  const renderSourceType = sourceType => {
    switch (sourceType) {
      case SOURCE_TYPE.internalPublic:
        return (
          <StorageLocationScreens
            storageLocationType={STORAGE_LOCATION_TYPE.public}
            initialUrl={initialUrl}
            onSelect={onSelect}
            onCancel={onCancel}
            />
        );
      case SOURCE_TYPE.internalPrivate:
        return (
          <StorageLocationScreens
            storageLocationType={STORAGE_LOCATION_TYPE.private}
            initialUrl={initialUrl}
            onSelect={onSelect}
            onCancel={onCancel}
            />
        );
      case SOURCE_TYPE.wikimediaCommons:
        return (
          <WikimediaCommonsScreens
            initialUrl={initialUrl}
            onSelect={onSelect}
            onCancel={onCancel}
            />
        );
      default:
        throw new Error(`Invalid location type: ${sourceType}`);
    }
  };

  return (
    <div className="ResourceSelector">
      <Tabs
        size="small"
        activeKey={selectedSourceType || visibleSourceTypes[0] || null}
        onChange={handleSourceTypeTabChange}
        destroyInactiveTabPane
        >
        {visibleSourceTypes.map(sourceType => (
          <TabPane key={sourceType} tab={t(`sourceType_${sourceType}`)}>
            {renderSourceType(sourceType)}
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
}

ResourceSelector.propTypes = {
  allowedSourceTypes: PropTypes.arrayOf(PropTypes.oneOf([SOURCE_TYPE.internalPublic, SOURCE_TYPE.internalPrivate, SOURCE_TYPE.wikimediaCommons])),
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func
};

ResourceSelector.defaultProps = {
  allowedSourceTypes: [],
  initialUrl: '',
  onCancel: () => {},
  onSelect: () => {}
};

export default ResourceSelector;
