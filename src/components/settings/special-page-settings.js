import PropTypes from 'prop-types';
import { Form, Input, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context';
import { useLanguage } from '../language-context';
import React, { useState, useEffect } from 'react';
import DocumentSelector from '../document-selector';
import LanguageNameProvider from '../../data/language-name-provider';
import CountryFlagAndName from '../localization/country-flag-and-name';
import { documentMetadataShape, documentRevisionShape, documentShape, settingsDocumentShape } from '../../ui/default-prop-types';

const FormItem = Form.Item;

const hasValue = value => value && String(value).trim();

const getRequiredValidateStatus = value => hasValue(value) ? 'success' : 'error';

const isValidPageListItem = item => [item.language, item.linkTitle, item.urlPath].every(hasValue);

const settingsToPageList = (supportedLanguages, settings) => {
  return supportedLanguages.map(supportedLanguage => {
    const setting = settings[supportedLanguage];
    return {
      key: supportedLanguage,
      language: supportedLanguage,
      linkTitle: setting?.linkTitle || '',
      urlPath: [setting?.documentNamespace || '', setting?.documentSlug || ''].filter(x => x).join('/') || ''
    };
  });
};

const pageListToSettings = pageList => {
  return pageList.reduce((map, item) => {
    const urlPathSegments = item.urlPath.split('/');
    map[item.language] = {
      linkTitle: item.linkTitle,
      documentNamespace: urlPathSegments[0] || '',
      documentSlug: urlPathSegments.slice(1).join('/') || ''
    };
    return map;
  }, {});
};

function SpecialPageSettings({ settings, documents, onChange }) {
  const { t } = useTranslation('specialPageSettings');
  const { language, supportedLanguages } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const [pageList, setPageList] = useState(settingsToPageList(supportedLanguages, settings));

  const languageNames = languageNameProvider.getData(language);

  useEffect(() => {
    setPageList(settingsToPageList(supportedLanguages, settings));
  }, [supportedLanguages, settings]);

  const handleChange = (record, key, value) => {
    const updatedPageList = pageList.map(item => item !== record ? item : { ...item, [key]: value });
    onChange(pageListToSettings(updatedPageList), { isValid: updatedPageList.every(isValidPageListItem) });
  };

  const renderLanguage = (text, record) => (
    <CountryFlagAndName code={languageNames[record.language]?.flag} name={languageNames[record.language]?.name || t('unknown')} />
  );

  const renderLinkTitle = (text, record) => (
    <FormItem validateStatus={getRequiredValidateStatus(record.linkTitle)} style={{ marginBottom: 0 }}>
      <Input value={record.linkTitle} onChange={event => handleChange(record, 'linkTitle', event.target.value)} />
    </FormItem>
  );

  const renderUrlPath = (text, record) => (
    <FormItem validateStatus={getRequiredValidateStatus(record.urlPath)} style={{ marginBottom: 0 }}>
      <DocumentSelector
        by="url"
        documents={documents}
        value={record.urlPath}
        onChange={value => handleChange(record, 'urlPath', value)}
        />
    </FormItem>
  );

  const columns = [
    { title: t('language'), key: 'language', dataIndex: 'language', width: '200px', render: renderLanguage },
    { title: t('linkTitle'), key: 'linkTitle', dataIndex: 'linkTitle', width: '450px', render: renderLinkTitle },
    { title: t('urlPath'), key: 'urlPath', dataIndex: 'urlPath', ellipsis: true, render: renderUrlPath }
  ];

  return (
    <Form>
      <Table
        size="small"
        columns={columns}
        dataSource={pageList}
        pagination={false}
        bordered
        />
    </Form>
  );
}

SpecialPageSettings.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.oneOfType([
    documentMetadataShape,
    documentRevisionShape,
    documentShape
  ])).isRequired,
  onChange: PropTypes.func.isRequired,
  settings: PropTypes.objectOf(settingsDocumentShape).isRequired
};

export default SpecialPageSettings;
