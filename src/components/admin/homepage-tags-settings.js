import PropTypes from 'prop-types';
import React, { memo } from 'react';
import TagSelect from '../tag-select.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';

const logger = new Logger(import.meta.url);

function HomepageTagsSettings({ tags, onChange }) {
  const { t } = useTranslation('homepageTagsSettings');

  const documentApiClient = useService(DocumentApiClient);

  const handleTagSuggestionsNeeded = searchText => {
    return documentApiClient.getDocumentTagSuggestions(searchText).catch(error => {
      handleApiError({ error, logger, t });
      return [];
    });
  };

  return (
    <div className="u-list">
      <TagSelect
        mode="multiple"
        value={tags}
        minSearchTextLength={1}
        onChange={onChange}
        onSuggestionsNeeded={handleTagSuggestionsNeeded}
        />
    </div>
  );
}

HomepageTagsSettings.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

HomepageTagsSettings.defaultProps = {
  tags: []
};

export default memo(HomepageTagsSettings);
