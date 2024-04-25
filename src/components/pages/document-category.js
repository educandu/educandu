import React from 'react';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import EmptyState from '../empty-state.js';
import slugify from '@sindresorhus/slugify';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import DocumentIcon from '../icons/general/document-icon.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { documentCategoryShape } from '../../ui/default-prop-types.js';

function DocumentCategory({ initialState, PageTemplate }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('documentCategory');

  const { currentDocumentCategory, otherDocumentCategories } = initialState;

  const currentDocumentCategoryIconUrl = currentDocumentCategory.iconUrl
    ? getAccessibleUrl({ url: currentDocumentCategory.iconUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    : null;

  const renderDocument = doc => {
    const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });

    return (
      <div key={doc._id} className="DocumentCategoryPage-document">
        <a href={url}>{doc.title}</a>
      </div>
    );
  };

  const renderOtherDocumentCategory = documentCategory => {
    const url = routes.getDocumentCategoryUrl({ id: documentCategory._id, slug: slugify(documentCategory.name) });
    const iconUrl = documentCategory.iconUrl
      ? getAccessibleUrl({ url: documentCategory.iconUrl, cdnRootUrl: clientConfig.cdnRootUrl })
      : null;

    return (
      <a href={url} key={documentCategory._id} className='DocumentCategoryPage-otherCategoryLink'>
        <div className="DocumentCategoryPage-temporaryBadge DocumentCategoryPage-temporaryBadge--small">
          {!!iconUrl && <img src={iconUrl} className="MaintenanceDocumentCategoriesTab-categoryIcon" />}
          {documentCategory.name}
        </div>
      </a>
    );
  };

  return (
    <PageTemplate>
      <div className="DocumentCategoryPage">
        <div className="DocumentCategoryPage-temporaryBadge">
          {!!currentDocumentCategoryIconUrl && (
            <img src={currentDocumentCategoryIconUrl} className="MaintenanceDocumentCategoriesTab-categoryIcon" />
          )}
          {currentDocumentCategory.name}
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
