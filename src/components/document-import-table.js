import by from 'thenby';
import PropTypes from 'prop-types';
import { Tooltip, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { getArticleUrl } from '../utils/urls.js';
import { useService } from './container-context.js';
import { DOCUMENT_IMPORT_TYPE } from '../common/constants.js';
import React, { useMemo, memo, useState, useEffect } from 'react';
import { useDateFormat, useLanguage } from './language-context.js';
import LanguageNameProvider from '../data/language-name-provider.js';
import CountryFlagAndName from './localization/country-flag-and-name.js';
import { CloudDownloadOutlined, CloudSyncOutlined } from '@ant-design/icons';

const getImportTypeIcon = importType => {
  switch (importType) {
    case DOCUMENT_IMPORT_TYPE.add:
      return <CloudDownloadOutlined />;
    case DOCUMENT_IMPORT_TYPE.update:
      return <CloudSyncOutlined />;
    default:
      throw new Error(`Invalid import type: '${importType}'`);
  }
};

const getLanguageComponent = documentLanguageData => {
  return <CountryFlagAndName code={documentLanguageData.flag} name={documentLanguageData.name} flagOnly />;
};

const getTooltipComponent = (importTypeIcon, importTypeTooltipText) => {
  return <Tooltip className="DocumentImportTable-importTypeIcon" title={importTypeTooltipText}>{importTypeIcon}</Tooltip>;
};

const getTitleComponent = (title, url) => {
  return url ? <a href={url} target="_blank" rel="noopener noreferrer" >{title}</a> : <span>{title}</span>;
};

function createRecords(importableDocuments, t, formatDate, languageNameProvider, language, importSourceBaseUrl) {
  const languagesData = languageNameProvider.getData(language);

  return importableDocuments.map(doc => {
    const documentLanguageData = languagesData[doc.language];
    const url = doc.slug ? `${importSourceBaseUrl}${getArticleUrl(doc.slug)}` : null;
    const importTypeIcon = getImportTypeIcon(doc.importType);
    const importTypeTooltipText = t(doc.importType);

    return {
      key: doc.key,
      title: doc.title,
      url,
      titleComponent: getTitleComponent(doc.title, url),
      language: doc.language,
      languageLocalized: documentLanguageData.name,
      languageComponent: getLanguageComponent(documentLanguageData),
      updatedOn: doc.updatedOn,
      updatedOnLocalized: formatDate(doc.updatedOn),
      importType: doc.importType,
      importTypeIcon,
      importTypeTooltipText,
      importTypeTooltipComponent: getTooltipComponent(importTypeIcon, importTypeTooltipText)
    };
  });
}

function DocumentImportTable({ importableDocuments, importSourceBaseUrl, loading, onSelectedKeysChange }) {
  const { language } = useLanguage();
  const { formatDate } = useDateFormat();
  const [records, setRecords] = useState([]);
  const { t } = useTranslation('documentImportTable');
  const languageNameProvider = useService(LanguageNameProvider);

  useEffect(() => {
    setRecords(createRecords(importableDocuments, t, formatDate, languageNameProvider, language, importSourceBaseUrl));
  }, [importableDocuments, t, formatDate, languageNameProvider, language, importSourceBaseUrl]);

  const columns = useMemo(() => [
    {
      title: t('importType'),
      key: 'importType',
      width: '150px',
      sorter: by(x => x.importType),
      render: (_text, record) => record.importTypeTooltipComponent,
      shouldCellUpdate: (record, prevRecord) => record.importType !== prevRecord.importType || record.importTypeTooltipText !== prevRecord.importTypeTooltipText
    },
    {
      title: t('title'),
      key: 'title',
      sorter: by(x => x.title),
      render: (_text, record) => record.titleComponent,
      shouldCellUpdate: (record, prevRecord) => record.title !== prevRecord.title || record.url !== prevRecord.url
    },
    {
      title: t('language'),
      key: 'language',
      width: '150px',
      sorter: by(x => x.language),
      render: (_text, record) => record.languageComponent,
      shouldCellUpdate: (record, prevRecord) => record.language !== prevRecord.language || record.languageLocalized !== prevRecord.languageLocalized
    },
    {
      title: t('updatedOn'),
      key: 'updatedOn',
      width: '200px',
      sorter: by(x => x.updatedOn),
      render: (_text, record) => record.updatedOnLocalized,
      shouldCellUpdate: (record, prevRecord) => record.updatedOn !== prevRecord.updatedOn
    }
  ], [t]);

  const tableRowSelection = useMemo(() => ({
    type: 'checkbox',
    onChange: onSelectedKeysChange
  }), [onSelectedKeysChange]);

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
    key: PropTypes.string.isRequired,
    importType: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired,
    updatedOn: PropTypes.string.isRequired
  })).isRequired,
  loading: PropTypes.bool,
  onSelectedKeysChange: PropTypes.func.isRequired
};

DocumentImportTable.defaultProps = {
  loading: false
};

export default memo(DocumentImportTable);
