import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useStorage } from './storage-context.js';
import React, { useEffect, useState } from 'react';
import StorageLocation from './storage-location.js';
import { STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { getStorageLocationTypeForUrl } from '../utils/storage-utils.js';

const { TabPane } = Tabs;

function ResourceSelector({ allowedLocationTypes, initialUrl, onCancel, onSelect }) {
  const { locations } = useStorage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [visibleLocations, setVisibleLocations] = useState([]);

  useEffect(() => {
    const newVisibleLocations = allowedLocationTypes
      .map(locationType => locations.find(location => location.type === locationType))
      .filter(location => location);

    const desiredLocationType = getStorageLocationTypeForUrl(initialUrl);
    const newCurrentLocation = newVisibleLocations.find(location => location.type === desiredLocationType) || newVisibleLocations[0];

    setVisibleLocations(newVisibleLocations);
    setCurrentLocation(newCurrentLocation);
  }, [allowedLocationTypes, initialUrl, locations]);

  const handleLocationTabChange = key => {
    setCurrentLocation(visibleLocations.find(location => location.type === key));
  };

  const renderLocation = location => {
    switch (location.type) {
      case STORAGE_LOCATION_TYPE.private:
      case STORAGE_LOCATION_TYPE.public:
        return (
          <StorageLocation
            storageLocation={location}
            isFullscreen={isFullscreen}
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
      {isFullscreen && renderLocation(currentLocation)}
      {!isFullscreen && (
        <Tabs defaultActiveKey={currentLocation?.type} onChange={handleLocationTabChange} size="small">
          {visibleLocations.map(loc => (
            <TabPane key={loc.type} tab={loc.type}>
              {renderLocation(loc)}
            </TabPane>
          ))}
        </Tabs>
      )}
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
