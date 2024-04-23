import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import React, { Fragment } from 'react';
import routes from '../../utils/routes.js';
import slugify from '@sindresorhus/slugify';
import { useTranslation } from 'react-i18next';
import { documentCategoryShape } from '../../ui/default-prop-types.js';

function DocumentCategory({ initialState, PageTemplate }) {
  const { t } = useTranslation('documentCategory');

  const { currentDocumentCategory, otherDocumentCategories } = initialState;

  return (
    <PageTemplate>
      <div className="DocumentCategoryPage">
        <h1 className="u-page-title">{t('documentCategoryNamePrefix')}: {currentDocumentCategory.name}</h1>
        <Markdown>{currentDocumentCategory.description}</Markdown>
        {!!otherDocumentCategories.length && (
          <Fragment>
            <h3>{t('otherDocumentCategories')}</h3>
            <ul>
              {otherDocumentCategories.map(c => (
                <li key={c._id}>
                  <a href={routes.getDocumentCategoryUrl({ id: c._id, slug: slugify(c.name) })}>
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </Fragment>
        )}
      </div>
    </PageTemplate>
  );
}

DocumentCategory.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    currentDocumentCategory: documentCategoryShape.isRequired,
    otherDocumentCategories: PropTypes.arrayOf(documentCategoryShape).isRequired
  }).isRequired
};

export default DocumentCategory;
