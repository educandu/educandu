import { Select } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from './container-context.js';
import DocumentApiClient from '../api-clients/document-api-client.js';

const { Option } = Select;

function DocumentPicker({ documentId, onChange }) {
  const { t } = useTranslation('documentPicker');
  const documentApiClient = useService(DocumentApiClient);

  const [loading, setLoading] = useState(false);
  const [documentOptions, setDocumentOptions] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    if (!documentId) {
      setDocumentOptions([]);
      setSelectedDocument(null);
      return;
    }

    (async () => {
      setLoading(true);

      const { doc } = await documentApiClient.getDocument(documentId);
      const { documents } = await documentApiClient.getDocumentsMetadata(doc.title);

      setDocumentOptions(documents);
      setSelectedDocument(doc);
      setLoading(false);
    })();
  }, [documentId, documentApiClient]);

  const handleSearch = async value => {
    let documents = [];

    if (value.length >= 3) {
      const response = await documentApiClient.getDocumentsMetadata(value);
      documents = response.documents;
    }

    setDocumentOptions(documents);
  };

  const handleSelect = (newDocumentId, option) => {
    // Eliminate input text jump between select and re-render
    setSelectedDocument({ _id: newDocumentId, title: option.children });
    onChange(newDocumentId);
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
      value={selectedDocument}
      onClear={handleClear}
      onSearch={handleSearch}
      onSelect={handleSelect}
      notFoundContent={null}
      placeholder={t('common:searchPlaceholder')}
      >
      {documentOptions.map(doc => <Option key={doc._id}>{doc.title}</Option>)}
    </Select>
  );
}

DocumentPicker.propTypes = {
  documentId: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

DocumentPicker.defaultProps = {
  documentId: null
};

export default DocumentPicker;
