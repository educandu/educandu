import { Card, Tooltip } from 'antd';
import routes from '../../utils/routes.js';
import FavoriteStar from '../favorite-star.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import { useSettings } from '../settings-context.js';
import { useDateFormat } from '../locale-context.js';
import UsersIcon from '../icons/main-menu/users-icon.js';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import PreviewIcon from '../icons/general/preview-icon.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';

function HomepageDocumentCards() {
  const settings = useSettings();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('homepageDocumentCards');
  const documentApiClient = useService(DocumentApiClient);

  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    (async () => {
      const response = await documentApiClient.getHomepageDocuments();
      setDocuments(response.documents);
    })();
  }, [settings, documentApiClient]);

  const handleNavigateClick = doc => {
    window.location = routes.getDocUrl({ id: doc._id });
  };

  const renderCardTitle = documentId => {
    return (
      <div className="HomepageDocumentCards-cardTitle">
        {documentId}
      </div>
    );
  };

  const renderFavoriteAction = doc => {
    return (
      <div className="HomepageDocumentCards-cardFavoriteAction" key="favorite">
        <FavoriteStar type={FAVORITE_TYPE.document} id={doc._id} />
      </div>
    );
  };

  const renderNavigateAction = doc => {
    return (
      <Tooltip key="users" title={t('common:viewDocument')} className="HomepageDocumentCards-cardNavigateAction">
        <div onClick={() => handleNavigateClick(doc)}>
          <PreviewIcon />
        </div>
      </Tooltip>
    );
  };

  const renderAuthorsAction = doc => {
    const firstAndLastContributors = [...new Set([doc.createdBy.displayName, doc.updatedBy.displayName])];
    const tooltipTitle = `${t('contributorsTooltipPrefix')}: ${firstAndLastContributors.join(', ')}`;

    return (
      <Tooltip key="users" title={tooltipTitle}>
        <div className="HomepageDocumentCards-cardUserAction"><UsersIcon /></div>
      </Tooltip>
    );
  };

  const renderCard = (doc, index) => {
    return (
      <Card
        key={index}
        title={renderCardTitle(doc.title)}
        className="HomepageDocumentCards-card"
        actions={[
          renderFavoriteAction(doc),
          renderAuthorsAction(doc),
          renderNavigateAction(doc)
        ]}
        >
        <div className="HomepageDocumentCards-cardContent">
          <div className="HomepageDocumentCards-cardContentDescription">
            {doc.description}
          </div>
          <div className="HomepageDocumentCards-cardContentDate">
            {formatDate(doc.updatedOn)}
          </div>
        </div>
      </Card>
    );
  };

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
