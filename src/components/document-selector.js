import by from 'thenby';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import DocumentApiClient from '../api-clients/document-api-client.js';

const { Option } = Select;

function DocumentSelector({ documentId, onChange, onTitleChange }) {
  const { t } = useTranslation('documentSelector');
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [lastTitle, setLastTitle] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);

  const updateOptions = documents => setOptions(documents
    .sort(by(d => d.title, { ignoreCase: true }))
    .map(doc => ({ key: doc._id, value: doc.title })));

  const currentTitle = selectedOption?.value || '';

  useEffect(() => {
    if (currentTitle !== lastTitle) {
      setLastTitle(currentTitle);
      onTitleChange(currentTitle);
    }
  }, [lastTitle, currentTitle, onTitleChange]);

  useEffect(() => {
    if (!documentId) {
      setOptions([]);
      setSelectedOption(null);
      return;
    }

    (async () => {
      setLoading(true);

      const { doc } = await documentApiClient.getDocument(documentId);
      const { documents } = await documentApiClient.getDocumentsMetadata(doc.title);

      updateOptions(documents);
      setSelectedOption({ key: doc._id, value: doc.title });
      setLoading(false);
    })();
  }, [documentId, documentApiClient]);

  const handleSearch = async value => {
    let documents = [];

    if (value.length >= 3) {
      const response = await documentApiClient.getDocumentsMetadata(value);
      documents = response.documents;
    }

    updateOptions(documents);
    setSelectedOption(null);
    onChange(null);
  };

  const handleSelect = (newDocumentId, option) => {
    if (newDocumentId !== selectedOption?._id) {
      // Eliminate input text jump between select and re-render
      setSelectedOption({ key: newDocumentId, value: option.children });
      onChange(newDocumentId);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <Select
      showSearch
      className=""
      allowClear
      loading={loading}
      filterOption={false}
      value={selectedOption}
      onClear={handleClear}
      onSearch={handleSearch}
      onSelect={handleSelect}
      notFoundContent={null}
      placeholder={t('searchPlaceholder')}
      >
      {options.map(option => <Option key={option.key}>{option.value}</Option>)}
    </Select>
  );
}

DocumentSelector.propTypes = {
  documentId: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onTitleChange: PropTypes.func
};

DocumentSelector.defaultProps = {
  documentId: null,
  onTitleChange: () => {}
};

export default DocumentSelector;
