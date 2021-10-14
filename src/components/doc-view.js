import React from 'react';
import PropTypes from 'prop-types';
import SectionDisplay from './section-display';
import { documentShape, documentRevisionShape } from '../ui/default-prop-types';

function DocView({ documentOrRevision, onAction }) {
  return (
    <article className="DocView" data-document-key={documentOrRevision.key}>
      {documentOrRevision.sections.map(section => (
        <SectionDisplay
          key={section.key}
          docKey={documentOrRevision.key}
          section={section}
          onAction={onAction}
          />
      ))}
    </article>
  );
}

DocView.propTypes = {
  documentOrRevision: PropTypes.oneOfType([documentShape, documentRevisionShape]).isRequired,
  onAction: PropTypes.func
};

DocView.defaultProps = {
  onAction: null
};

export default DocView;
