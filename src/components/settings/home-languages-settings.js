import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button, Table } from 'antd';
import React, { useState, useEffect } from 'react';
import DocumentSelector from '../document-selector';
import LanguageSelect from '../localization/language-select';
import { swapItems, removeItem } from '../../utils/immutable-array-utils';
import { DeleteOutlined, DownOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { documentMetadataShape, documentRevisionShape, documentShape, homeLanguageShape } from '../../ui/default-prop-types';

const FormItem = Form.Item;

const hasValue = value => value && String(value).trim();

const getRequiredValidateStatus = value => hasValue(value) ? 'success' : 'error';

const newHomeLanguage = { language: '', documentKey: '', searchFieldButton: '', searchFieldPlaceholder: '' };

function HomeLanguagesSettings({ homeLanguages, documents, onChange }) {
  const { t } = useTranslation('homeLanguagesSettings');
  const [data, setData] = useState(homeLanguages.map((hl, idx) => ({ key: idx, value: hl })));

  useEffect(() => {
    setData(prev => homeLanguages.map((hl, idx) => prev[idx] === hl ? prev[idx] : { key: idx, value: hl }));
  }, [homeLanguages]);

  const fireOnChange = updatedHomeLanguages => {
    onChange(updatedHomeLanguages, { isValid: updatedHomeLanguages.every(hl => Object.values(hl).every(hasValue)) });
  };

  const handleMoveClick = (index, offset) => {
    fireOnChange(swapItems(homeLanguages, index, index + offset));
  };

  const handleAddClick = () => {
    fireOnChange([...homeLanguages, { ...newHomeLanguage }]);
  };

  const handleDeleteClick = index => {
    fireOnChange(removeItem(homeLanguages, index));
  };

  const handleChange = (record, key, value) => {
    fireOnChange(homeLanguages.map(hl => hl !== record ? hl : { ...hl, [key]: value }));
  };

  const renderRank = (text, record, index) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      <Button size="small" icon={<UpOutlined />} disabled={index === 0} onClick={() => handleMoveClick(index, -1)} />
      <Button size="small" icon={<DownOutlined />} disabled={index === homeLanguages.length - 1} onClick={() => handleMoveClick(index, +1)} />
    </span>
  );

  const renderLanguage = (text, record) => (
    <FormItem validateStatus={getRequiredValidateStatus(record.value.language)} style={{ marginBottom: 0 }}>
      <LanguageSelect
        value={record.value.language}
        onChange={value => handleChange(record.value, 'language', value)}
        />
    </FormItem>
  );

  const renderDocumentKey = (text, record) => (
    <FormItem validateStatus={getRequiredValidateStatus(record.value.documentKey)} style={{ marginBottom: 0 }}>
      <DocumentSelector
        by="key"
        documents={documents}
        value={record.value.documentKey}
        onChange={value => handleChange(record.value, 'documentKey', value)}
        />
    </FormItem>
  );

  const renderSearchFieldButton = (text, record) => (
    <FormItem validateStatus={getRequiredValidateStatus(record.value.searchFieldButton)} style={{ marginBottom: 0 }}>
      <Input value={record.value.searchFieldButton} onChange={event => handleChange(record.value, 'searchFieldButton', event.target.value)} />
    </FormItem>
  );

  const renderSearchFieldPlaceholder = (text, record) => (
    <FormItem validateStatus={getRequiredValidateStatus(record.value.searchFieldPlaceholder)} style={{ marginBottom: 0 }}>
      <Input value={record.value.searchFieldPlaceholder} onChange={event => handleChange(record.value, 'searchFieldPlaceholder', event.target.value)} />
    </FormItem>
  );

  const renderActions = (text, record, index) => (
    <Button size="small" icon={<DeleteOutlined style={{ color: 'red' }} />} onClick={() => handleDeleteClick(index)} danger />
  );

  const renderActionsTitle = () => (
    <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => handleAddClick()} />
  );

  const columns = [
    { title: t('rank'), key: 'rank', width: '64px', render: renderRank },
    { title: t('language'), key: 'language', dataIndex: ['value', 'language'], width: '180px', render: renderLanguage },
    { title: t('documentKey'), key: 'documentKey', dataIndex: ['value', 'documentKey'], ellipsis: true, render: renderDocumentKey },
    { title: t('searchFieldButton'), key: 'searchFieldButton', dataIndex: ['value', 'searchFieldButton'], width: '224px', render: renderSearchFieldButton },
    { title: t('searchFieldPlaceholder'), key: 'searchFieldPlaceholder', dataIndex: ['value', 'searchFieldPlaceholder'], width: '224px', render: renderSearchFieldPlaceholder },
    { title: renderActionsTitle, key: 'actions', width: '40px', render: renderActions }
  ];

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

HomeLanguagesSettings.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.oneOfType([
    documentMetadataShape,
    documentRevisionShape,
    documentShape
  ])).isRequired,
  homeLanguages: PropTypes.arrayOf(homeLanguageShape).isRequired,
  onChange: PropTypes.func.isRequired
};

export default HomeLanguagesSettings;
