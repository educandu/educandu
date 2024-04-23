import React from 'react';
import PropTypes from 'prop-types';

function DocumentCategory({ initialState, PageTemplate }) {
  const { documentCategory } = initialState;

  return (
    <PageTemplate >
      <div className="DocumentCategoryPage">
        {JSON.stringify(documentCategory, null, 2)}
      </div>
    </PageTemplate>
  );
}

DocumentCategory.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documentCategory: PropTypes.any // documentCategoryShape.isRequired
  }).isRequired
};

export default DocumentCategory;
