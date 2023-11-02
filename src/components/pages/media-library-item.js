import React from 'react';
import PropTypes from 'prop-types';
import { mediaLibraryItemShape } from '../../ui/default-prop-types.js';
import ResourceDetails from '../resource-selector/shared/resource-details.js';
import MediaLibraryMetadataDisplay from '../resource-selector/media-library/media-library-metadata-display.js';

function MediaLibraryItem({ initialState, PageTemplate }) {

  return (
    <PageTemplate>
      <div className="MediaLibraryItemPage">
        <ResourceDetails url={initialState.mediaLibraryItem.url} size={initialState.mediaLibraryItem.size} />
        <MediaLibraryMetadataDisplay mediaLibraryItem={initialState.mediaLibraryItem} />
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
