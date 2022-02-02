import React from 'react';
import PropTypes from 'prop-types';
import CreditsFooter from '../credits-footer.js';
import SectionsDisplay from '../sections-display.js';
import { documentRevisionShape } from '../../ui/default-prop-types.js';

function Revision({ initialState, PageTemplate }) {
  const { revision } = initialState.revision;

  return (
    <PageTemplate >
      <div className="RevisionPage">
        <SectionsDisplay
          sections={revision.sections}
          sectionsContainerId={revision.key}
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
