import { useTranslation } from 'react-i18next';
import DocumentCard from '../document-card.js';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import { useSettings } from '../settings-context.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';

function HomepageDocumentCards() {
  const settings = useSettings();
  const { t } = useTranslation('homepageDocumentCards');
  const documentApiClient = useService(DocumentApiClient);

  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    (async () => {
      const response = await documentApiClient.getHomepageDocuments();
      setDocuments(response.documents);
    })();
  }, [settings, documentApiClient]);

  const renderCard = doc => <DocumentCard doc={doc} key={doc._id} />;

  if (!documents.length) {
    return null;
  }

  return (
    <div className="HomepageDocumentCards">
      <div className="HomepageDocumentCards-headline">{t('headline')}</div>
      <div className="HomepageDocumentCards-cards">
        {documents.map(renderCard)}
      </div>
    </div>
  );
}

export default HomepageDocumentCards;
