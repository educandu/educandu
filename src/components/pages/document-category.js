import React from 'react';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import EmptyState from '../empty-state.js';
import { useTranslation } from 'react-i18next';
import DocumentIcon from '../icons/general/document-icon.js';
import DocumentCategoryDisplay from '../document-category-display.js';
import { documentCategoryShape } from '../../ui/default-prop-types.js';

function DocumentCategory({ initialState, PageTemplate }) {
  const { t } = useTranslation('documentCategory');

  const { currentDocumentCategory, otherDocumentCategories } = initialState;

  const renderDocument = doc => {
    const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });

    return (
      <div key={doc._id} className="DocumentCategoryPage-document">
        <a href={url}>{doc.title}</a>
      </div>
    );
  };

  const renderOtherDocumentCategory = documentCategory => {
    return (
      <DocumentCategoryDisplay key={documentCategory._id} bordered asLink documentCategory={documentCategory} />
    );
  };

  return (
    <PageTemplate>
      <div className="DocumentCategoryPage">
        <div className="DocumentCategoryPage-header">
          <DocumentCategoryDisplay bordered documentCategory={currentDocumentCategory} />
        </div>

        <div className="DocumentCategoryPage-content">
          <section className="DocumentCategoryPage-section">
            <Markdown>{currentDocumentCategory.description}</Markdown>
          </section>

          <section className="DocumentCategoryPage-section">
            <div className='DocumentCategoryPage-sectionHeadline'>{t('common:documentCategoryDocumentListHeader')}</div>
            {!currentDocumentCategory.documents.length && (
              <EmptyState
                icon={<DocumentIcon />}
                title={t('documentsSectionmptyStateTitle')}
                subtitle={t('documentsSectionmptyStateSubtitle')}
                />
            )}
            {!!currentDocumentCategory.documents.length && currentDocumentCategory.documents.map(renderDocument)}
          </section>

          {!!otherDocumentCategories.length && (
            <section className="DocumentCategoryPage-section">
              <div className='DocumentCategoryPage-sectionHeadline'>{t('otherDocumentCategories')}</div>
              <div className="DocumentCategoryPage-otherCategories">
                {otherDocumentCategories.map(renderOtherDocumentCategory)}
              </div>
            </section>
          )}
        </div>
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
