import by from 'thenby';
import PropTypes from 'prop-types';
import { Button, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import DocumentApiClient from '../api-clients/document-api-client.js';

const { Option } = Select;

function DocumentSelector({
  documentId,
  useSelectButton,
  selectButtonText,
  onChange,
  onTitleChange,
  onSelectButtonClick
}) {
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
      const { documents } = await documentApiClient.getSearchableDocumentsTitles({ query: doc.title });

      updateOptions(documents);
      setSelectedOption({ key: doc._id, value: doc.title });
      setLoading(false);
    })();
  }, [documentId, documentApiClient]);

  const handleSearch = async value => {
    let documents = [];

    if (value.length >= 3) {
      const response = await documentApiClient.getSearchableDocumentsTitles({ query: value });
      documents = response.documents;
    }

    updateOptions(documents);
    setSelectedOption(null);
    onChange(null);
  };

  const handleSelect = (newDocumentId, option) => {
    if (newDocumentId !== selectedOption?.key) {
      // Eliminate input text jump between select and re-render
      setSelectedOption({ key: newDocumentId, value: option.children });
      onChange(newDocumentId);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  const handleSelectButtonClick = () => {
    onSelectButtonClick(selectedOption.key);
    setSelectedOption(null);
  };

  return (
    <div className="u-input-and-button">
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
      {!!useSelectButton && (
        <Button
          type='primary'
          disabled={!selectedOption}
          onClick={handleSelectButtonClick}
          >
          {selectButtonText || t('common:select')}
        </Button>
      )}
    </div>
  );
}

DocumentSelector.propTypes = {
  documentId: PropTypes.string,
  useSelectButton: PropTypes.bool,
  selectButtonText: PropTypes.string,
  onChange: PropTypes.func,
  onTitleChange: PropTypes.func,
  onSelectButtonClick: PropTypes.func,
};

DocumentSelector.defaultProps = {
  documentId: null,
  useSelectButton: false,
  selectButtonText: '',
  onChange: () => {},
  onTitleChange: () => {},
  onSelectButtonClick: () => {}
};

export default DocumentSelector;
