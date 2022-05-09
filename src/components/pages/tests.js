import React from 'react';
import PropTypes from 'prop-types';

function Tests({ PageTemplate }) {
  return (
    <PageTemplate>
      <div className="TestsPage">
        insert tests here
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;
