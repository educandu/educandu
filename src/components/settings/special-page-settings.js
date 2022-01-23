import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { Form, Input, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../language-context.js';
import DocumentSelector from '../document-selector.js';
import LanguageFlagAndName from '../language-flag-and-name.js';
import { documentMetadataShape, documentRevisionShape, documentShape, settingsDocumentShape } from '../../ui/default-prop-types.js';

const FormItem = Form.Item;

const settingsToPageList = (supportedLanguages, settings = {}) => {
  return supportedLanguages.map(supportedLanguage => {
    const setting = settings[supportedLanguage];
    return {
      key: supportedLanguage,
      language: supportedLanguage,
      linkTitle: setting?.linkTitle || '',
      urlPath: [setting?.documentKey || '', setting?.documentSlug || ''].filter(x => x).join('/') || ''
    };
  });
};

const pageListToSettings = pageList => {
  return pageList.reduce((map, item) => {
    const urlPathSegments = item.urlPath.split('/');
    map[item.language] = {
      linkTitle: item.linkTitle,
      documentKey: urlPathSegments[0] || '',
      documentSlug: urlPathSegments.slice(1).join('/') || ''
    };
    return map;
  }, {});
};

function SpecialPageSettings({ settings, documents, onChange }) {
  const { t } = useTranslation('specialPageSettings');
  const { supportedLanguages } = useLanguage();

  const handleChange = (index, key, value) => {
    const pageList = settingsToPageList(supportedLanguages, settings);
    const updatedPageList = pageList.map((item, idx) => idx !== index ? item : { ...item, [key]: value });
    onChange(pageListToSettings(updatedPageList), { isValid: true });
  };

  const renderLanguage = (text, record) => (
    <LanguageFlagAndName language={record.language} />
  );

  const renderLinkTitle = (text, record, index) => (
    <FormItem style={{ marginBottom: 0 }}>
      <Input value={record.linkTitle} onChange={event => handleChange(index, 'linkTitle', event.target.value)} />
    </FormItem>
  );

  const renderUrlPath = (text, record, index) => (
    <FormItem style={{ marginBottom: 0 }}>
      <DocumentSelector
        by="url"
        documents={documents}
        value={record.urlPath}
        onChange={value => handleChange(index, 'urlPath', value)}
        />
    </FormItem>
  );

  const columns = [
    { title: t('common:language'), key: 'language', dataIndex: 'language', render: renderLanguage },
    { title: t('linkTitle'), key: 'linkTitle', dataIndex: 'linkTitle', render: renderLinkTitle },
    { title: t('urlPath'), key: 'urlPath', dataIndex: 'urlPath', ellipsis: true, render: renderUrlPath }
  ];

  const data = settingsToPageList(supportedLanguages, settings);

  return (
    <Form>
      <Table
        size="small"
        columns={columns}
        dataSource={data}
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
  settings: PropTypes.objectOf(settingsDocumentShape)
};

SpecialPageSettings.defaultProps = {
  settings: {}
};

export default memo(SpecialPageSettings);
