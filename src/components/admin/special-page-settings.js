import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { Form, Input, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import DocumentSelector from '../document-selector.js';
import { settingsDocumentShape } from '../../ui/default-prop-types.js';
import LanguageFlagAndName from '../localization/language-flag-and-name.js';

const FormItem = Form.Item;

const settingsToPageList = (supportedUiLanguages, settings = {}) => {
  return supportedUiLanguages.map(uiLanguage => {
    const setting = settings[uiLanguage];
    return {
      key: uiLanguage,
      language: uiLanguage,
      linkTitle: setting?.linkTitle || '',
      documentId: setting?.documentId || ''
    };
  });
};

const pageListToSettings = pageList => {
  return pageList.reduce((map, item) => {
    map[item.language] = {
      linkTitle: item.linkTitle,
      documentId: item.documentId
    };
    return map;
  }, {});
};

function SpecialPageSettings({ settings, onChange }) {

  const { t } = useTranslation('specialPageSettings');
  const { supportedUiLanguages } = useLocale();

  const handleChange = (index, key, value) => {
    const pageList = settingsToPageList(supportedUiLanguages, settings);
    const updatedPageList = pageList.map((item, idx) => idx !== index ? item : { ...item, [key]: value });
    onChange(pageListToSettings(updatedPageList));
  };

  const renderLanguage = (text, record) => (
    <LanguageFlagAndName language={record.language} />
  );

  const renderLinkTitle = (text, record, index) => (
    <FormItem style={{ marginBottom: 0 }}>
      <Input value={record.linkTitle} onChange={event => handleChange(index, 'linkTitle', event.target.value)} />
    </FormItem>
  );

  const renderDocumentId = (text, record, index) => (
    <FormItem style={{ marginBottom: 0 }}>
      <DocumentSelector documentId={record.documentId} onChange={value => handleChange(index, 'documentId', value)} />
    </FormItem>
  );

  const columns = [
    { title: t('common:language'), key: 'language', dataIndex: 'language', render: renderLanguage },
    { title: t('linkTitle'), key: 'linkTitle', dataIndex: 'linkTitle', render: renderLinkTitle },
    { title: t('common:documentTitle'), key: 'documentId', dataIndex: 'documentId', ellipsis: true, render: renderDocumentId }
  ];

  const data = settingsToPageList(supportedUiLanguages, settings);

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
  onChange: PropTypes.func.isRequired,
  settings: PropTypes.objectOf(settingsDocumentShape)
};

SpecialPageSettings.defaultProps = {
  settings: {}
};

export default memo(SpecialPageSettings);
