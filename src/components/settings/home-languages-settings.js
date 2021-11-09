import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { Form, Button, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import DocumentSelector from '../document-selector.js';
import LanguageSelect from '../localization/language-select.js';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import { DeleteOutlined, DownOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { documentMetadataShape, documentRevisionShape, documentShape, homeLanguageShape } from '../../ui/default-prop-types.js';

const FormItem = Form.Item;

const hasValue = value => value && String(value).trim();

const getRequiredValidateStatus = value => hasValue(value) ? 'success' : 'error';

const newHomeLanguage = { language: '', documentKey: '' };

function HomeLanguagesSettings({ homeLanguages, documents, onChange }) {
  const { t } = useTranslation('homeLanguagesSettings');

  const fireOnChange = updatedHomeLanguages => {
    onChange(updatedHomeLanguages, { isValid: updatedHomeLanguages.every(hl => Object.values(hl).every(hasValue)) });
  };

  const handleMoveClick = (index, offset) => {
    fireOnChange(swapItemsAt(homeLanguages, index, index + offset));
  };

  const handleAddClick = () => {
    fireOnChange([...homeLanguages || [], { ...newHomeLanguage }]);
  };

  const handleDeleteClick = index => {
    fireOnChange(removeItemAt(homeLanguages, index));
  };

  const handleChange = (index, key, value) => {
    fireOnChange(homeLanguages.map((hl, idx) => idx !== index ? hl : { ...hl, [key]: value }));
  };

  const renderRank = (text, record, index) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      <Button size="small" icon={<UpOutlined />} disabled={index === 0} onClick={() => handleMoveClick(index, -1)} />
      <Button size="small" icon={<DownOutlined />} disabled={index === homeLanguages.length - 1} onClick={() => handleMoveClick(index, +1)} />
    </span>
  );

  const renderLanguage = (text, record, index) => (
    <FormItem validateStatus={getRequiredValidateStatus(record.language)} style={{ marginBottom: 0 }}>
      <LanguageSelect
        value={record.language}
        onChange={value => handleChange(index, 'language', value)}
        />
    </FormItem>
  );

  const renderDocumentKey = (text, record, index) => (
    <FormItem validateStatus={getRequiredValidateStatus(record.documentKey)} style={{ marginBottom: 0 }}>
      <DocumentSelector
        by="key"
        documents={documents}
        value={record.documentKey}
        onChange={value => handleChange(index, 'documentKey', value)}
        />
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
    { title: t('language'), key: 'language', dataIndex: 'language', width: '180px', render: renderLanguage },
    { title: t('documentKey'), key: 'documentKey', dataIndex: 'documentKey', ellipsis: true, render: renderDocumentKey },
    { title: renderActionsTitle, key: 'actions', width: '40px', render: renderActions }
  ];

  const data = (homeLanguages || []).map((record, index) => ({
    key: index,
    language: record.language,
    documentKey: record.documentKey
  }));

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

export default memo(HomeLanguagesSettings);
