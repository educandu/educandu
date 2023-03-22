import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ResourcePreview from './resource-preview.js';
import BreakIntoWords from '../../break-into-words.js';
import { browserFileType } from '../../../ui/default-prop-types.js';

function SelectedResourceDisplay({ urlOrFile, metadata, footer }) {
  const { t } = useTranslation('selectedResourceDisplay');

  let subtitle;
  if (typeof urlOrFile === 'string') {
    subtitle = urlOrFile;
  } else if (urlOrFile instanceof File) {
    subtitle = urlOrFile.name;
  } else {
    subtitle = null;
  }

  return (
    <div className="SelectedResourceDisplay">
      <div>
        <div className="SelectedResourceDisplay-title">{t('currentlySelectedFile')}:</div>
        {!!subtitle && <div className="SelectedResourceDisplay-subtitle"><BreakIntoWords>{subtitle}</BreakIntoWords></div>}
      </div>
      <ResourcePreview urlOrFile={urlOrFile} />
      {!!metadata && <div className="SelectedResourceDisplay-metadata">{metadata}</div>}
      {!!footer && <div className="SelectedResourceDisplay-footer">{footer}</div>}
    </div>
  );
}

SelectedResourceDisplay.propTypes = {
  urlOrFile: PropTypes.oneOfType([
    PropTypes.string,
    browserFileType
  ]).isRequired,
  metadata: PropTypes.node,
  footer: PropTypes.node
};

SelectedResourceDisplay.defaultProps = {
  metadata: null,
  footer: null
};

export default SelectedResourceDisplay;
