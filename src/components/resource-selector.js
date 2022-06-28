import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useStorage } from './storage-context.js';
import React, { useEffect, useState } from 'react';
import StorageLocation from './storage-location.js';
import { STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { getStorageLocationTypeForUrl } from '../utils/storage-utils.js';

const { TabPane } = Tabs;

function ResourceSelector({ allowedLocationTypes, initialUrl, onCancel, onSelect }) {
  const { locations } = useStorage();
  const { t } = useTranslation('resourceSelector');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleLocations, setVisibleLocations] = useState([]);
  const [currentLocationType, setCurrentLocationType] = useState(null);

  useEffect(() => {
    const newVisibleLocations = allowedLocationTypes
      .map(locationType => locations.find(location => location.type === locationType))
      .filter(location => location);

    setVisibleLocations(newVisibleLocations);

    setCurrentLocationType(oldCurrentLocationType => {
      const desiredLocationType = oldCurrentLocationType || getStorageLocationTypeForUrl(initialUrl);
      const newCurrentLocation = newVisibleLocations.find(location => location.type === desiredLocationType) || newVisibleLocations[0];
      return newCurrentLocation?.type || null;
    });
  }, [allowedLocationTypes, initialUrl, locations]);

  const handleLocationTabChange = newLocationType => {
    setCurrentLocationType(visibleLocations.find(location => location.type === newLocationType)?.type || null);
  };

  const renderLocation = location => {
    switch (location.type) {
      case STORAGE_LOCATION_TYPE.private:
      case STORAGE_LOCATION_TYPE.public:
        return (
          <StorageLocation
            storageLocation={location}
            initialUrl={initialUrl}
            onEnterFullscreen={() => setIsFullscreen(true)}
            onExitFullscreen={() => setIsFullscreen(false)}
            onSelect={onSelect}
            onCancel={onCancel}
            />
        );
      default:
        throw new Error(`Invalid location type: ${location.type}`);
    }
  };

  return (
    <div className="ResourceSelector">
      <Tabs
        size="small"
        activeKey={currentLocationType || visibleLocations[0]?.type || null}
        onChange={handleLocationTabChange}
        renderTabBar={isFullscreen ? () => null : null}
        >
        {visibleLocations.map(location => (
          <TabPane key={location.type} tab={t(`storage_${location.type}`)}>
            {renderLocation(location)}
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
}

ResourceSelector.propTypes = {
  allowedLocationTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(STORAGE_LOCATION_TYPE))),
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func
};

ResourceSelector.defaultProps = {
  allowedLocationTypes: [],
  initialUrl: '',
  onCancel: () => {},
  onSelect: () => {}
};

export default ResourceSelector;
