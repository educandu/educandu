import React from 'react';
import PropTypes from 'prop-types';
import FilesGridViewer from '../files-grid-viewer.js';

function Tests({ PageTemplate }) {
  return (
    <PageTemplate>
      <div className="TestsPage">
        <FilesGridViewer />
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;
