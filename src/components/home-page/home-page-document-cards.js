import { Card, Tooltip } from 'antd';
import routes from '../../utils/routes.js';
import FavoriteStar from '../favorite-star.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import { useSettings } from '../settings-context.js';
import { useDateFormat } from '../locale-context.js';
import FileIcon from '../icons/general/file-icon.js';
import UsersIcon from '../icons/main-menu/users-icon.js';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';

function HomePageDocumentCards() {
  const settings = useSettings();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('homePageDocumentCards');
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
      <div className="HomePageDocumentCards-cardTitle">
        {documentId}
      </div>
    );
  };

  const renderFavoriteAction = doc => {
    return (
      <div className="HomePageDocumentCards-cardFavoriteAction" key="favorite">
        <FavoriteStar type={FAVORITE_TYPE.document} id={doc._id} />
      </div>
    );
  };

  const renderNavigateAction = doc => {
    return (
      <Tooltip key="users" title={t('common:viewDocument')}>
        <div onClick={() => handleNavigateClick(doc)}>
          <FileIcon />
        </div>
      </Tooltip>
    );
  };

  const renderAuthorsAction = doc => {
    const firstAndLastContributors = [...new Set([doc.createdBy.displayName, doc.updatedBy.displayName])];
    const tooltipTitle = `${t('contributorsTooltipPrefix')}: ${firstAndLastContributors.join(', ')}`;

    return (
      <Tooltip key="users" title={tooltipTitle}>
        <div className="HomePageDocumentCards-cardUserAction"><UsersIcon /></div>
      </Tooltip>
    );
  };

  const renderCard = (doc, index) => {
    return (
      <Card
        key={index}
        title={renderCardTitle(doc.title)}
        className="HomePageDocumentCards-card"
        actions={[
          renderFavoriteAction(doc),
          renderAuthorsAction(doc),
          renderNavigateAction(doc)
        ]}
        >
        <div className="HomePageDocumentCards-cardContent">
          <div className="HomePageDocumentCards-cardContentDescription">
            {doc.description}
          </div>
          <div className="HomePageDocumentCards-cardContentDate">
            {formatDate(doc.updatedOn)}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="HomePageDocumentCards">
      <div className="HomePageDocumentCards-headline">{t('headline')}</div>
      <div className="HomePageDocumentCards-cards">
        {documents.map(renderCard)}
      </div>
    </div>
  );
}

export default HomePageDocumentCards;
