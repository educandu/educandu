import React from 'react';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { ALERT_TYPE } from '../custom-alert.js';
import CreditsFooter from '../credits-footer.js';
import SectionsDisplay from '../sections-display.js';
import { useDateFormat } from '../locale-context.js';
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
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInput');
  const { documentInput, documentRevision } = initialState;

  const userUrl = routes.getUserProfileUrl(documentInput.createdBy._id);
  const documentUrl = routes.getDocUrl({ id: documentInput.documentId });

  const alerts = [
    {
      message: (
        <Markdown>{t('alertMarkdown', {
          userName: documentInput.createdBy.displayName,
          userUrl,
          date: formatDate(documentInput.createdOn),
          documentTitle: documentInput.documentTitle,
          documentUrl
        })}
        </Markdown>
      ),
      type: ALERT_TYPE.info
    }
  ];

  return (
    <PageTemplate alerts={alerts}>
      <div>
        <SectionsDisplay
          documentInput={documentInput}
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
