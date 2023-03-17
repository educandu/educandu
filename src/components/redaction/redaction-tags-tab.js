import by from 'thenby';
import { Select, Table, Tag } from 'antd';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import SortingSelector from '../sorting-selector.js';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { documentExtendedMetadataShape, mediaLibraryItemShape } from '../../ui/default-prop-types.js';
import MediaLibaryItemModal, { MEDIA_LIBRARY_ITEM_MODAL_MODE } from '../resource-selector/media-library/media-library-item-modal.js';

const TAG_CATEGORY_FILTER = {
  documentsAndMedia: 'documentsAndMedia',
  documentsOnly: 'documentsOnly',
  mediaOnly: 'mediaOnly'
};

function createTableRow(tag) {
  return {
    key: tag,
    name: tag,
    frequency: 0,
    documents: [],
    mediaLibraryItems: [],
    companionTags: [],
    companionTagCount: 0,
    companionTagFrequencies: {}
  };
}

function createTableRows(documents, mediaLibraryItems, tagCategoryFilter) {
  const rowMap = new Map();

  if (tagCategoryFilter !== TAG_CATEGORY_FILTER.mediaOnly) {
    for (const doc of documents) {
      if (doc.publicContext?.archived === false) {
        for (const tag of doc.tags) {
          const row = rowMap.get(tag) || createTableRow(tag);
          row.documents = [...row.documents, doc];
          row.frequency = row.documents.length + row.mediaLibraryItems.length;
          for (const otherTag of doc.tags) {
            if (tag !== otherTag) {
              row.companionTagFrequencies[otherTag] = (row.companionTagFrequencies[otherTag] || 0) + 1;
            }
          }
          rowMap.set(tag, row);
        }
      }
    }
  }

  if (tagCategoryFilter !== TAG_CATEGORY_FILTER.documentsOnly) {
    for (const item of mediaLibraryItems) {
      for (const tag of item.tags) {
        const row = rowMap.get(tag) || createTableRow(tag);
        row.mediaLibraryItems = [...row.mediaLibraryItems, item];
        row.frequency = row.documents.length + row.mediaLibraryItems.length;
        for (const otherTag of item.tags) {
          if (tag !== otherTag) {
            row.companionTagFrequencies[otherTag] = (row.companionTagFrequencies[otherTag] || 0) + 1;
          }
        }
        rowMap.set(tag, row);
      }
    }
  }

  const finalRows = [...rowMap.values()];

  for (const row of finalRows) {
    row.documents.sort(by(x => x.title, { ignoreCase: true }));
    row.mediaLibraryItems.sort(by(x => x.name, { ignoreCase: true }));
    row.companionTags = Object.entries(row.companionTagFrequencies)
      .map(([name, frequency]) => ({ name, frequency }))
      .sort(by(x => x.frequency, 'desc').thenBy(x => x.name, { ignoreCase: true }));
    row.companionTagCount = row.companionTags.length;
  }

  return finalRows;
}

function getMediaLibraryItemModalState({ mode = MEDIA_LIBRARY_ITEM_MODAL_MODE.create, mediaLibraryItem = null, isOpen = false }) {
  return { mode, isOpen, mediaLibraryItem };
}

function RedactionTagsTab({ documents, mediaLibraryItems }) {
  const [filterText, setFilterText] = useState('');
  const { t } = useTranslation('redactionTagsTab');
  const [allTableRows, setAllTableRows] = useState([]);
  const [currentPagination, setCurrentPagination] = useState(1);
  const [displayedTableRows, setDisplayedTableRows] = useState([]);
  const [tagCategoryFilter, setTagCategoryFilter] = useState(TAG_CATEGORY_FILTER.documentsAndMedia);
  const [currentTableSorting, setCurrentTableSorting] = useState({ value: 'name', direction: 'asc' });
  const [mediaLibraryItemModalState, setMediaLibraryItemModalState] = useState(getMediaLibraryItemModalState({}));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [currentPagination]);

  useEffect(() => {
    setAllTableRows(createTableRows(documents, mediaLibraryItems, tagCategoryFilter));
  }, [documents, mediaLibraryItems, tagCategoryFilter]);

  const tagCategoryFilterOptions = useMemo(() => {
    return Object.values(TAG_CATEGORY_FILTER).map(value => ({ value, label: t(`tagCategoryFilter_${value}`) }));
  }, [t]);

  const tableSortingOptions = useMemo(() => [
    { label: t('common:name'), appliedLabel: t('common:sortedByName'), value: 'name' },
    { label: t('frequency'), appliedLabel: t('sortedByFrequency'), value: 'frequency' },
    { label: t('companionTagCount'), appliedLabel: t('sortedByCompanionTagCount'), value: 'companionTagCount' }
  ], [t]);

  const tableSorters = useMemo(() => ({
    name: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.name, { direction, ignoreCase: true })),
    frequency: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.frequency, direction)),
    companionTagCount: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.companionTagCount, direction))
  }), []);

  useEffect(() => {
    const filter = filterText.toLowerCase().trim();
    const filteredRows = filter
      ? allTableRows.filter(row => row.name.toLowerCase().includes(filter))
      : allTableRows;

    const sorter = tableSorters[currentTableSorting.value];
    const sortedRows = sorter(filteredRows, currentTableSorting.direction);

    setDisplayedTableRows(sortedRows);
  }, [allTableRows, filterText, currentTableSorting, tableSorters]);

  const handleTableChange = ({ current, pageSize }) => {
    setCurrentPagination([current, pageSize].join());
  };

  const handleCurrentTableSortingChange = newSorting => {
    setCurrentTableSorting(newSorting);
  };

  const handleFilterTextChange = event => {
    setFilterText(event.target.value);
  };

  const handleMediaLibraryItemPreviewClick = (mediaLibraryItem, event) => {
    event.preventDefault();
    setMediaLibraryItemModalState(getMediaLibraryItemModalState({
      mode: MEDIA_LIBRARY_ITEM_MODAL_MODE.preview,
      mediaLibraryItem,
      isOpen: true
    }));
  };

  const handleMediaLibraryItemModalClose = () => {
    setMediaLibraryItemModalState(getMediaLibraryItemModalState({}));
  };

  const renderExpandedRow = row => {
    return (
      <div className="RedactionTagsTab-expandedRow">
        {!!row.documents.length && (
          <Fragment>
            <div className="RedactionTagsTab-expandedRowHeader">{t('documents')}:</div>
            <ul className="RedactionTagsTab-documentList">
              {row.documents.map(doc => (
                <li key={doc._id}>
                  <a href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>{doc.title}</a>
                </li>
              ))}
            </ul>
          </Fragment>
        )}
        {!!row.mediaLibraryItems.length && (
          <Fragment>
            <div className="RedactionTagsTab-expandedRowHeader">{t('mediaLibraryItems')}:</div>
            <ul className="RedactionTagsTab-documentList">
              {row.mediaLibraryItems.map(item => (
                <li key={item._id}>
                  <a href={item.url} onClick={event => handleMediaLibraryItemPreviewClick(item, event)}>{item.name}</a>
                </li>
              ))}
            </ul>
          </Fragment>
        )}
        {!!row.companionTags.length && (
          <Fragment>
            <div className="RedactionTagsTab-expandedRowHeader">{t('companionTags')}:</div>
            <div className="RedactionTagsTab-companionTags">
              {row.companionTags.map(ctag => (
                <span key={ctag.name} className="RedactionTagsTab-companionTag">
                  <Tag>{ctag.name}</Tag>
                  <span className="RedactionTagsTab-companionTagFrequency">({ctag.frequency})</span>
                </span>
              ))}
            </div>
          </Fragment>
        )}
      </div>
    );
  };

  const tableColumns = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: t('frequency'),
      dataIndex: 'frequency',
      key: 'frequency'
    },
    {
      title: t('companionTagCount'),
      dataIndex: 'companionTagCount',
      key: 'companionTagCount'
    }
  ];

  return (
    <div className="RedactionTagsTab">
      <div className="RedactionTagsTab-controls">
        <FilterInput
          size="large"
          className="RedactionTagsTab-textFilter"
          value={filterText}
          onChange={handleFilterTextChange}
          placeholder={t('filterPlaceholder')}
          />
        <SortingSelector
          size="large"
          options={tableSortingOptions}
          sorting={currentTableSorting}
          onChange={handleCurrentTableSortingChange}
          />
        <Select
          value={tagCategoryFilter}
          options={tagCategoryFilterOptions}
          className="RedactionTagsTab-tagCategoryFilter"
          onChange={setTagCategoryFilter}
          />
      </div>
      <Table
        columns={tableColumns}
        dataSource={displayedTableRows}
        expandable={{ expandedRowRender: renderExpandedRow }}
        onChange={handleTableChange}
        />
      <MediaLibaryItemModal {...mediaLibraryItemModalState} onClose={handleMediaLibraryItemModalClose} />
    </div>
  );
}

RedactionTagsTab.propTypes = {
  documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired,
  mediaLibraryItems: PropTypes.arrayOf(mediaLibraryItemShape).isRequired
};

export default RedactionTagsTab;
