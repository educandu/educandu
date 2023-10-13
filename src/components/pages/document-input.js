import React from 'react';
import PropTypes from 'prop-types';
import CreditsFooter from '../credits-footer.js';
import SectionsDisplay from '../sections-display.js';
import PluginRegistry from '../../plugins/plugin-registry.js';
import { ensurePluginComponentAreLoadedForSections } from '../../utils/plugin-utils.js';
import { documentInputShape, documentRevisionShape } from '../../ui/default-prop-types.js';

class DocumentInputPreloader {
  static dependencies = [PluginRegistry];

  constructor(pluginRegistry) {
    this.pluginRegistry = pluginRegistry;
  }

  preload({ initialState }) {
    return ensurePluginComponentAreLoadedForSections({
      sections: initialState.documentRevision.sections,
      pluginRegistry: this.pluginRegistry,
      displayOnly: true
    });
  }
}

function DocumentInput({ initialState, PageTemplate }) {
  const { documentInput, documentRevision } = initialState;

  return (
    <PageTemplate >
      <div>
        <SectionsDisplay
          inputs={documentInput.sections}
          sections={documentRevision.sections}
          />
        <CreditsFooter revision={documentRevision} />
      </div>
    </PageTemplate>
  );
}

DocumentInput.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documentInput: documentInputShape.isRequired,
    documentRevision: documentRevisionShape.isRequired
  }).isRequired
};

DocumentInput.clientPreloader = DocumentInputPreloader;

export default DocumentInput;
