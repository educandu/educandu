import { Button } from 'antd';
import { TAB } from './constants.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import DocumentCategoryMetadataModal from './document-category-metadata-modal.js';

function getDefaultMetadataModalState() {
  return {
    isOpen: false,
    isEditing: false,
    initialDocumentCategory: {
      name: '',
      iconUrl: '',
      description: ''
    }
  };
}

function MaintenanceDocumentCategoriesTab() {
  const { t } = useTranslation('maintenanceDocumentCategoriesTab');

  const [metadataModalState, setMetadataModalState] = useState(getDefaultMetadataModalState());

  useEffect(() => {
    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.documentCategories));
  }, []);

  const handleCreateDocumentCategoryClick = () => {
    setMetadataModalState(prev => ({ ...prev, isOpen: true }));
  };

  const handleMetadataModalSave = () => {
    setMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleMetadataModalClose = () => {
    setMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="MaintenanceDocumentCategoriesTab">
      <div className="MaintenanceDocumentCategoriesTab-controls">
        <div />
        <Button type="primary" onClick={handleCreateDocumentCategoryClick}>
          {t('common:create')}
        </Button>
      </div>
      <DocumentCategoryMetadataModal
        {...metadataModalState}
        onSave={handleMetadataModalSave}
        onClose={handleMetadataModalClose}
        />
    </div>
  );
}

export default MaintenanceDocumentCategoriesTab;
