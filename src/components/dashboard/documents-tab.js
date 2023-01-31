import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import DocumentCard from '../document-card.js';
import { useTranslation } from 'react-i18next';
import { Button, Pagination, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { contributedDocumentMetadataShape } from '../../ui/default-prop-types.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';

const PAGE_SIZE = 8;
const DEFAULT_PAGE_NUMBER = 1;

function DocumentsTab({ documents, loading }) {
  const { t } = useTranslation('documentsTab');

  const [filterText, setFilterText] = useState(null);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE_NUMBER);
  const [pageDocuments, setPageDocuments] = useState([]);
  const [displayedDocuments, setDisplayedDocuments] = useState([]);

  useEffect(() => {
    setCurrentPage(DEFAULT_PAGE_NUMBER);
  }, [documents, filterText]);

  useEffect(() => {
    const lowerCasedFilter = (filterText || '').toLowerCase();
    const filteredDocuments = filterText
      ? documents.filter(doc => {
        return doc.title.toLowerCase().includes(lowerCasedFilter)
            || doc.description.toLowerCase().includes(lowerCasedFilter)
            || doc.createdBy.displayName.toLowerCase().includes(lowerCasedFilter)
            || doc.updatedBy.displayName.toLowerCase().includes(lowerCasedFilter);
      })
      : documents;

    const indexOfFirstPageDocument = (currentPage - 1) * PAGE_SIZE;
    const indexOfLastPageDocument = indexOfFirstPageDocument + PAGE_SIZE;

    setDisplayedDocuments(filteredDocuments);
    setPageDocuments(filteredDocuments.slice(indexOfFirstPageDocument, indexOfLastPageDocument));
  }, [documents, filterText, currentPage]);

  const [isDocumentModalOpen, setIsDocumentCreationModalOpen] = useState(false);

  const handleCreateDocumentClick = () => {
    setIsDocumentCreationModalOpen(true);
  };

  const handleDocumentModalSave = createdDocuments => {
    setIsDocumentCreationModalOpen(false);

    window.location = routes.getDocUrl({
      id: createdDocuments[0]._id,
      slug: createdDocuments[0].slug,
      view: DOC_VIEW_QUERY_PARAM.edit
    });
  };

  const handleDocumentModalClose = () => {
    setIsDocumentCreationModalOpen(false);
  };

  const handleFilterChange = event => {
    const { value } = event.target;
    setFilterText(value);
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  return (
    <div className="DocumentsTab">
      <div className="DocumentsTab-info">{t('info')}</div>

      <Button className="DocumentsTab-button" type="primary" onClick={handleCreateDocumentClick}>
        {t('common:createDocument')}
      </Button>

      <section>
        {!!loading && <Spin className="u-spin" />}
        {!loading && !documents.length && t('noDocuments')}

        {!loading && !!documents.length && (
          <div className="DocumentsTab-documentsPanel">
            <FilterInput
              value={filterText}
              className="DocumentsTab-filter"
              onChange={handleFilterChange}
              />
            <div>
              <span className="DocumentsTab-counter">{t('documentsCount', { count: displayedDocuments.length })}</span>
              <div className="DocumentsTab-documents">
                {pageDocuments.map(doc => (<DocumentCard key={doc._id} doc={doc} />))}
              </div>
            </div>
            <Pagination
              hideOnSinglePage
              pageSize={PAGE_SIZE}
              current={currentPage}
              onChange={handlePageChange}
              className="DocumentsTab-pagination"
              total={displayedDocuments.length}
              />
          </div>
        )}
      </section>

      <DocumentMetadataModal
        allowMultiple={false}
        initialDocumentMetadata={{}}
        isOpen={isDocumentModalOpen}
        mode={DOCUMENT_METADATA_MODAL_MODE.create}
        onSave={handleDocumentModalSave}
        onClose={handleDocumentModalClose}
        />
    </div>
  );
}

DocumentsTab.propTypes = {
  documents: PropTypes.arrayOf(contributedDocumentMetadataShape).isRequired,
  loading: PropTypes.bool.isRequired
};

export default DocumentsTab;
