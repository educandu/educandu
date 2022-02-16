import React from 'react';
import PropTypes from 'prop-types';
import CreditsFooter from '../credits-footer.js';
import SectionsDisplay from '../sections-display.js';
import { documentRevisionShape } from '../../ui/default-prop-types.js';

function Revision({ initialState, PageTemplate }) {
  const { revision } = initialState;

  const publicStorage = {
    rootPath: 'media',
    initialPath: `media/${revision.key}`,
    uploadPath: `media/${revision.key}`
  };

  return (
    <PageTemplate >
      <div className="RevisionPage">
        <SectionsDisplay
          sections={revision.sections}
          publicStorage={publicStorage}
          canEdit={false}
          />
      </div>
      <aside className="Content">
        <CreditsFooter revision={revision} />
      </aside>
    </PageTemplate>
  );
}

Revision.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    revision: documentRevisionShape.isRequired
  }).isRequired
};

export default Revision;
