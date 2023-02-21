import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { Form, Button } from 'antd';
import DeleteButton from '../delete-button.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import DocumentSelector from '../document-selector.js';
import { removeItemAt, replaceItemAt } from '../../utils/array-utils.js';

const FormItem = Form.Item;

const MAX_DOCUMENTS_COUNT = 10;

const hasValue = value => value && String(value).trim();

const getRequiredValidateStatus = value => hasValue(value) ? 'success' : 'error';

function HomepageDocuments({ documentIds, onChange }) {
  const { t } = useTranslation('homepageDocuments');

  const handleAddClick = () => {
    onChange([...documentIds, '']);
  };

  const handleDeleteClick = index => {
    onChange(removeItemAt(documentIds, index));
  };

  const handleDocumentIdChange = (index, value) => {
    const updatedDocumentIds = replaceItemAt(documentIds, value, index);
    onChange(updatedDocumentIds);
  };

  return (
    <Form>
      <div className="u-list">
        {documentIds.map((documentId, index) => (
          <FormItem key={index} validateStatus={getRequiredValidateStatus(documentId)} style={{ marginBottom: 0 }}>
            <div className="u-input-and-button">
              <DocumentSelector documentId={documentId} onChange={value => handleDocumentIdChange(index, value)} />
              <DeleteButton onClick={() => handleDeleteClick(index)} />
            </div>
          </FormItem>
        ))}
        <div className="u-button">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={documentIds.length === MAX_DOCUMENTS_COUNT}
            onClick={() => handleAddClick()}
            >
            {t('common:addDocument')}
          </Button>
        </div>
      </div>
    </Form>
  );
}

HomepageDocuments.propTypes = {
  documentIds: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

HomepageDocuments.defaultProps = {
  documentIds: []
};

export default memo(HomepageDocuments);
