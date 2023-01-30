import { Button } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';

function DocumentsTab() {
  const { t } = useTranslation('documentsTab');

  const [isDocumentCreationModalOpen, setIsDocumentCreationModalOpen] = useState(false);

  const handleCreateDocumentClick = () => {
    setIsDocumentCreationModalOpen(true);
  };

  const handleDocumentCreationModalClose = () => {
    setIsDocumentCreationModalOpen(false);
  };

  return (
    <div className="DocumentsTab">
      <div className="DocumentsTab-info">{t('info')}</div>

      <Button className="DocumentsTab-createDocumentButton" type="primary" onClick={handleCreateDocumentClick}>
        {t('common:createDocument')}
      </Button>

      <section />
      <DocumentMetadataModal
        allowMultiple={false}
        initialDocumentMetadata={{}}
        isOpen={isDocumentCreationModalOpen}
        mode={DOCUMENT_METADATA_MODAL_MODE.create}
        onSave={() => { console.log('redirect'); }}
        onClose={handleDocumentCreationModalClose}
        />
    </div>
  );
}

export default DocumentsTab;
