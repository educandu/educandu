import React from 'react';
import Page from '../page';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { documentShape, documentRevisionShape } from '../../ui/default-prop-types';

const handleBackClick = () => window.history.back();

function Search({ initialState }) {
  const { t } = useTranslation();
  const { type } = initialState;

  return (
    <Page headerActions={[]}>
      {type === 'document' && (
        <aside className="Content">
          <a onClick={handleBackClick}>{t('common:back')}</a>
        </aside>
      )}
    </Page>
  );
}

Search.propTypes = {
  initialState: PropTypes.shape({
    documentOrRevision: PropTypes.oneOfType([documentShape, documentRevisionShape]),
    type: PropTypes.oneOf(['document', 'revision'])
  }).isRequired
};

export default Search;
