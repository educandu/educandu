import by from 'thenby';
import { Table, Tag } from 'antd';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import SortingSelector from '../sorting-selector.js';
import React, { useEffect, useMemo, useState } from 'react';
import { documentExtendedMetadataShape } from '../../ui/default-prop-types.js';

function createTableRow(tag) {
  return {
    key: tag,
    name: tag,
    frequency: 0,
    documents: [],
    companionTags: [],
    companionTagCount: 0,
    companionTagFrequencies: {}
  };
}

function createTableRows(docs) {
  const rowMap = new Map();

  for (const doc of docs) {
    for (const tag of doc.tags) {
      const row = rowMap.get(tag) || createTableRow(tag);
      row.documents = [...row.documents, doc];
      row.frequency = row.documents.length;
      for (const otherTag of doc.tags) {
        if (tag !== otherTag) {
          row.companionTagFrequencies[otherTag] = (row.companionTagFrequencies[otherTag] || 0) + 1;
        }
      }
      rowMap.set(tag, row);
    }
  }

  const finalRows = [...rowMap.values()];

  for (const row of finalRows) {
    row.documents.sort(by(x => x.title, { ignoreCase: true }));
    row.companionTags = Object.entries(row.companionTagFrequencies)
      .map(([name, frequency]) => ({ name, frequency }))
      .sort(by(x => x.frequency, 'desc').thenBy(x => x.name, { ignoreCase: true }));
    row.companionTagCount = row.companionTags.length;
  }

  return finalRows;
}

function RedactionDocumentTagsTab({ documents }) {
  const [filterText, setFilterText] = useState('');
  const [allTableRows, setAllTableRows] = useState([]);
  const { t } = useTranslation('redactionDocumentTagsTab');
  const [displayedTableRows, setDisplayedTableRows] = useState([]);
  const [currentTableSorting, setCurrentTableSorting] = useState({ value: 'name', direction: 'asc' });

  useEffect(() => {
    setAllTableRows(createTableRows(documents));
  }, [documents]);

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

  const handleCurrentTableSortingChange = newSorting => {
    setCurrentTableSorting(newSorting);
  };

  const handleFilterTextChange = event => {
    setFilterText(event.target.value);
  };

  const renderExpandedRow = row => {
    return (
      <div className="RedactionDocumentTagsTab-expandedRow">
        <div className="RedactionDocumentTagsTab-expandedRowHeader">{t('documents')}:</div>
        <ul className="RedactionDocumentTagsTab-documentList">
          {row.documents.map(doc => (
            <li key={doc._id}>
              <a href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>{doc.title}</a>
            </li>
          ))}
        </ul>
        <div className="RedactionDocumentTagsTab-expandedRowHeader">{t('companionTags')}:</div>
        <div className="RedactionDocumentTagsTab-companionTags">
          {row.companionTags.map(ctag => (
            <span key={ctag.name} className="RedactionDocumentTagsTab-companionTag">
              <Tag>{ctag.name}</Tag>
              <span className="RedactionDocumentTagsTab-companionTagFrequency">({ctag.frequency})</span>
            </span>
          ))}
        </div>
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
    <div className="RedactionDocumentTagsTab">
      <div className="RedactionDocumentTagsTab-controls">
        <FilterInput
          size="large"
          className="RedactionDocumentTagsTab-filter"
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
      </div>
      <Table
        columns={tableColumns}
        dataSource={displayedTableRows}
        expandable={{ expandedRowRender: renderExpandedRow }}
        />
    </div>
  );
}

RedactionDocumentTagsTab.propTypes = {
  documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired
};

export default RedactionDocumentTagsTab;
