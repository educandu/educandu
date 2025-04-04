import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import Markdown from '../markdown.js';
import EmptyState from '../empty-state.js';
import { Checkbox, Pagination } from 'antd';
import FilterInput from '../filter-input.js';
import { useUser } from '../user-context.js';
import DocumentCard from '../document-card.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import FileIcon from '../icons/general/file-icon.js';
import FilterIcon from '../icons/general/filter-icon.js';
import { contributedDocumentMetadataShape } from '../../ui/default-prop-types.js';

const PAGE_SIZE = 8;
const DEFAULT_PAGE_NUMBER = 1;

function DocumentsTab({ documents, loading }) {
  const user = useUser();
  const { t } = useTranslation('documentsTab');

  const [filterText, setFilterText] = useState(null);
  const [pageDocuments, setPageDocuments] = useState([]);
  const [ownDocumentsOnly, setOwnDocumentsOnly] = useState(false);
  const [displayedDocuments, setDisplayedDocuments] = useState([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE_NUMBER);

  useEffect(() => {
    setCurrentPage(DEFAULT_PAGE_NUMBER);
  }, [documents, filterText, ownDocumentsOnly]);

  useEffect(() => {
    const lowerCasedFilter = (filterText || '').toLowerCase();
    let filteredDocuments = filterText
      ? documents.filter(doc => {
        return doc.title.toLowerCase().includes(lowerCasedFilter)
            || doc.shortDescription.toLowerCase().includes(lowerCasedFilter)
            || doc.createdBy.displayName.toLowerCase().includes(lowerCasedFilter)
            || doc.updatedBy.displayName.toLowerCase().includes(lowerCasedFilter);
      })
      : documents;

    filteredDocuments = ownDocumentsOnly
      ? filteredDocuments.filter(doc => doc.createdBy._id === user._id)
      : filteredDocuments;

    const indexOfFirstPageDocument = (currentPage - 1) * PAGE_SIZE;
    const indexOfLastPageDocument = indexOfFirstPageDocument + PAGE_SIZE;

    setDisplayedDocuments(filteredDocuments);
    setPageDocuments(filteredDocuments.slice(indexOfFirstPageDocument, indexOfLastPageDocument));
  }, [user, documents, filterText, ownDocumentsOnly, currentPage]);

  const handleFilterChange = event => {
    const { value } = event.target;
    setFilterText(value);
  };

  const handleOwnDocumentsOnlyChange = event => {
    const { checked } = event.target;
    setOwnDocumentsOnly(checked);
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const showNoDataEmptyState = !documents.length;
  const showNoMatchingDataEmptyState = !!filterText && !displayedDocuments.length;

  return (
    <div className="DocumentsTab">
      <section>
        {!!loading && <Spinner />}

        {!loading && !!showNoDataEmptyState && (
          <EmptyState
            icon={<FileIcon />}
            title={t('emptyStateTitle')}
            subtitle={
              <Markdown>{t('emptyStateSubtitleMarkdown')}</Markdown>
            }
            />
        )}

        {!loading && !showNoDataEmptyState && (
          <div className="DocumentsTab-documentsPanel">
            <div className="DocumentsTab-filters">
              <FilterInput
                value={filterText}
                className="DocumentsTab-textFilter"
                onChange={handleFilterChange}
                />
              <Checkbox checked={ownDocumentsOnly} onChange={handleOwnDocumentsOnlyChange}>{t('ownDocumentOnly')}</Checkbox>
            </div>
            <div>
              {!!displayedDocuments.length && (
                <span className="DocumentsTab-counter">{t('documentsCount', { count: displayedDocuments.length })}</span>
              )}
              <div className="DocumentsTab-documents">
                {pageDocuments.map(doc => (<DocumentCard key={doc._id} doc={doc} />))}
                {!!showNoMatchingDataEmptyState && (
                  <div className="DocumentsTab-filterEmptyState">
                    <EmptyState
                      icon={<FilterIcon />}
                      title={t('common:filterResultEmptyStateTitle')}
                      subtitle={t('common:searchOrFilterResultEmptyStateSubtitle')}
                      />
                  </div>
                )}
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
    </div>
  );
}

DocumentsTab.propTypes = {
  documents: PropTypes.arrayOf(contributedDocumentMetadataShape).isRequired,
  loading: PropTypes.bool.isRequired
};

export default DocumentsTab;
