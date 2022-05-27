import PropTypes from 'prop-types';
import { useStorage } from './storage-context.js';
import React, { useEffect, useState } from 'react';
import { STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { getStorageLocationTypeForUrl } from '../utils/storage-utils.js';

function ResourceSelector({ allowedLocationTypes, initialUrl }) {
  const { locations } = useStorage();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [visibleLocations, setVisibleLocations] = useState([]);

  useEffect(() => {
    const newVisibleLocations = allowedLocationTypes.map(lt => locations.find(l => l.type === lt)).filter(l => l);
    const desiredLocationType = getStorageLocationTypeForUrl(initialUrl);
    const newCurrentLocation = newVisibleLocations.find(l => l.type === desiredLocationType) || null;
    setVisibleLocations(newVisibleLocations);
    setCurrentLocation(newCurrentLocation);
  }, [allowedLocationTypes, initialUrl, locations]);

  return (
    <div>
      {JSON.stringify({ visibleLocations, currentLocation })};
    </div>
  );
}

ResourceSelector.propTypes = {
  allowedLocationTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(STORAGE_LOCATION_TYPE))),
  initialUrl: PropTypes.string
};

ResourceSelector.defaultProps = {
  allowedLocationTypes: [],
  initialUrl: ''
};

export default ResourceSelector;
