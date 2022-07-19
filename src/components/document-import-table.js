import by from 'thenby';
import { Table } from 'antd';
import PropTypes from 'prop-types';
import urls from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import ImportTypeIcon from './import-type-icon.js';
import { useService } from './container-context.js';
import LanguageIcon from './localization/language-icon.js';
import { useDateFormat, useLocale } from './locale-context.js';
import React, { useMemo, memo, useState, useEffect } from 'react';
import LanguageNameProvider from '../data/language-name-provider.js';

const getTitleComponent = (title, url) => {
  return url ? <a href={url} target="_blank" rel="noopener noreferrer" >{title}</a> : <span>{title}</span>;
};

function createRecords(importableDocuments, formatDate, languageNameProvider, language, importSourceBaseUrl) {
  const languagesData = languageNameProvider.getData(language);

  return importableDocuments.map(doc => {
    const documentLanguageData = languagesData[doc.language];
    const url = `${importSourceBaseUrl}${urls.getDocUrl({ id: doc._id, slug: doc.slug })}`;

    return {
      id: doc._id,
      key: doc._id,
      title: doc.title,
      url,
      titleComponent: getTitleComponent(doc.title, url),
      language: doc.language,
      languageLocalized: documentLanguageData.name,
      languageComponent: <LanguageIcon language={doc.language} flagOnly />,
      updatedOn: doc.updatedOn,
      updatedOnLocalized: formatDate(doc.updatedOn),
      importType: doc.importType,
      importTypeIcon: <ImportTypeIcon importType={doc.importType} />
    };
  });
}

function DocumentImportTable({ importableDocuments, importSourceBaseUrl, loading, onSelectedIdsChange }) {
  const { uiLanguage } = useLocale();
  const { formatDate } = useDateFormat();
  const [records, setRecords] = useState([]);
  const { t } = useTranslation('documentImportTable');
  const languageNameProvider = useService(LanguageNameProvider);

  useEffect(() => {
    setRecords(createRecords(importableDocuments, formatDate, languageNameProvider, uiLanguage, importSourceBaseUrl));
  }, [importableDocuments, t, formatDate, languageNameProvider, uiLanguage, importSourceBaseUrl]);

  const columns = useMemo(() => [
    {
      title: t('importType'),
      key: 'importType',
      width: '150px',
      sorter: by(x => x.importType),
      render: (_text, record) => record.importTypeIcon,
      shouldCellUpdate: (record, prevRecord) => record.importType !== prevRecord.importType
    },
    {
      title: t('common:title'),
      key: 'title',
      sorter: by(x => x.title, { ignoreCase: true }),
      render: (_text, record) => record.titleComponent,
      shouldCellUpdate: (record, prevRecord) => record.title !== prevRecord.title || record.url !== prevRecord.url
    },
    {
      title: t('common:language'),
      key: 'language',
      width: '150px',
      sorter: by(x => x.language),
      render: (_text, record) => record.languageComponent,
      shouldCellUpdate: (record, prevRecord) => record.language !== prevRecord.language || record.languageLocalized !== prevRecord.languageLocalized,
      responsive: ['md']
    },
    {
      title: t('common:updatedOn'),
      key: 'updatedOn',
      width: '200px',
      sorter: by(x => x.updatedOn),
      render: (_text, record) => record.updatedOnLocalized,
      shouldCellUpdate: (record, prevRecord) => record.updatedOn !== prevRecord.updatedOn,
      responsive: ['lg']
    }
  ], [t]);

  const tableRowSelection = useMemo(() => ({
    type: 'checkbox',
    onChange: onSelectedIdsChange
  }), [onSelectedIdsChange]);

  return (
    <Table
      bordered
      size="small"
      rowKey="key"
      className="DocumentImportTable"
      rowSelection={tableRowSelection}
      columns={columns}
      pagination={false}
      dataSource={records}
      loading={loading}
      />
  );
}

DocumentImportTable.propTypes = {
  importSourceBaseUrl: PropTypes.string.isRequired,
  importableDocuments: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    importType: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired,
    updatedOn: PropTypes.string.isRequired
  })).isRequired,
  loading: PropTypes.bool,
  onSelectedIdsChange: PropTypes.func.isRequired
};

DocumentImportTable.defaultProps = {
  loading: false
};

export default memo(DocumentImportTable);
