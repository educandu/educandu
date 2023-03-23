import React from 'react';
import PropTypes from 'prop-types';
import { useDateFormat } from './locale-context.js';
import { documentRevisionShape } from '../ui/default-prop-types.js';

function DocumentVersionHistory({ documentRevisions }) {
  const { formatDate } = useDateFormat();

  const renderDocumentRevision = documentRevision => {
    return (
      <div key={documentRevision._id}>
        {formatDate(documentRevision.createdOn)}
      </div>
    );
  };

  return (
    <div className="DocumentVersionHistory">
      {documentRevisions.forEach(renderDocumentRevision)}
    </div>
  );
}

DocumentVersionHistory.propTypes = {
  documentRevisions: PropTypes.arrayOf(documentRevisionShape).isRequired
};

export default DocumentVersionHistory;
