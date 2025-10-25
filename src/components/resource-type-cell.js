import React from 'react';
import PropTypes from 'prop-types';
import RsourceTypeIcon from './resource-type-icon.js';
import { SEARCH_RESOURCE_TYPE } from '../domain/constants.js';

function ResourceTypeCell({ searchResourceType }) {
  return (
    <div className="ResourceTypeCell">
      <RsourceTypeIcon searchResourceType={searchResourceType} />
    </div>
  );
}

ResourceTypeCell.propTypes = {
  searchResourceType: PropTypes.oneOf(Object.values(SEARCH_RESOURCE_TYPE)).isRequired
};

export default ResourceTypeCell;
