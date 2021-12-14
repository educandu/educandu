import React from 'react';
import PropTypes from 'prop-types';
import SectionDisplay from './section-display.js';
import { SECTION_ACTIONS } from '../ui/section-actions.js';
import { documentShape, documentRevisionShape } from '../ui/default-prop-types.js';

function DocView({ documentOrRevision, onAction, disabledActions }) {
  return (
    <article className="DocView" data-document-key={documentOrRevision.key}>
      {documentOrRevision.sections.map(section => (
        <SectionDisplay
          key={section.key}
          docKey={documentOrRevision.key}
          section={section}
          onAction={onAction}
          disabledActions={disabledActions}
          />
      ))}
    </article>
  );
}

DocView.propTypes = {
  disabledActions: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SECTION_ACTIONS))),
  documentOrRevision: PropTypes.oneOfType([documentShape, documentRevisionShape]).isRequired,
  onAction: PropTypes.func
};

DocView.defaultProps = {
  disabledActions: [],
  onAction: null
};

export default DocView;
