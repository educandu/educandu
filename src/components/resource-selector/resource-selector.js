import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useStorage } from '../storage-context.js';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getSourceType } from '../../utils/source-utils.js';
import WikimediaScreens from './wikimedia/wikimedia-screens.js';
import RoomMediaScreens from './room-media/room-media-screens.js';
import MediaLibraryScreens from './media-library/media-library-screens.js';
import { SOURCE_TYPE, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

const possibleSourceTypes = [
  SOURCE_TYPE.mediaLibrary,
  SOURCE_TYPE.roomMedia,
  SOURCE_TYPE.wikimedia
];

function ResourceSelector({ allowedSourceTypes, initialUrl, onCancel, onSelect }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('resourceSelector');
  const { locations: availableStorageLocations } = useStorage();
  const [visibleSourceTypes, setVisibleSourceTypes] = useState([]);
  const [selectedSourceType, setSelectedSourceType] = useState(null);

  useEffect(() => {
    const newVisibleSourceTypes = allowedSourceTypes.filter(sourceType => {
      switch (sourceType) {
        case SOURCE_TYPE.roomMedia:
          return availableStorageLocations.some(location => location.type === STORAGE_LOCATION_TYPE.roomMedia);
        case SOURCE_TYPE.mediaLibrary:
          return possibleSourceTypes.includes(sourceType);
        default:
          return possibleSourceTypes.includes(sourceType);
      }
    });

    setVisibleSourceTypes(newVisibleSourceTypes);

    setSelectedSourceType(oldSelectedSourceType => {
      const sourceTypeMatchedByInitialUrl = getSourceType({ url: initialUrl, cdnRootUrl: clientConfig.cdnRootUrl });
      const preferredInitialSourceType = SOURCE_TYPE.roomMedia;
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
    let Component;
    switch (sourceType) {
      case SOURCE_TYPE.mediaLibrary:
        Component = MediaLibraryScreens;
        break;
      case SOURCE_TYPE.roomMedia:
        Component = RoomMediaScreens;
        break;
      case SOURCE_TYPE.wikimedia:
        Component = WikimediaScreens;
        break;
      default:
        Component = null;
        break;
    }

    return !!Component && <Component initialUrl={initialUrl} onSelect={onSelect} onCancel={onCancel} />;
  };

  return (
    <div className="ResourceSelector">
      <Tabs
        size="small"
        activeKey={selectedSourceType || visibleSourceTypes[0] || null}
        onChange={handleSourceTypeTabChange}
        destroyInactiveTabPane
        items={visibleSourceTypes.map(sourceType => ({
          key: sourceType,
          label: t(`sourceType_${sourceType}`),
          children: renderSourceType(sourceType)
        }))}
        />
    </div>
  );
}

ResourceSelector.propTypes = {
  allowedSourceTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SOURCE_TYPE))),
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
