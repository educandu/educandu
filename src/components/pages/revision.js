import React from 'react';
import PropTypes from 'prop-types';
import CreditsFooter from '../credits-footer.js';
import SectionsDisplay from '../sections-display.js';
import { documentRevisionShape } from '../../ui/default-prop-types.js';
import PluginRegistry from '../../plugins/plugin-registry.js';
import { ensurePluginComponentAreLoadedForSections } from '../../utils/plugin-utils.js';

class RevisionPreloader {
  static dependencies = [PluginRegistry];

  constructor(pluginRegistry) {
    this.pluginRegistry = pluginRegistry;
  }

  preload({ initialState }) {
    return ensurePluginComponentAreLoadedForSections({
      sections: initialState.revision.sections,
      pluginRegistry: this.pluginRegistry,
      displayOnly: true
    });
  }
}

function Revision({ initialState, PageTemplate }) {
  const { revision } = initialState;

  return (
    <PageTemplate >
      <div className="RevisionPage">
        <SectionsDisplay sections={revision.sections} />
        <CreditsFooter revision={revision} />
      </div>
    </PageTemplate>
  );
}

Revision.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    revision: documentRevisionShape.isRequired
  }).isRequired
};

Revision.clientPreloader = RevisionPreloader;

export default Revision;
