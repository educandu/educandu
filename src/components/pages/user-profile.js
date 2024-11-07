import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import Markdown from '../markdown.js';
import { Avatar, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import DocumentCard from '../document-card.js';
import { PlusOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import FavoriteToggle from '../favorite-toggle.js';
import { useService } from '../container-context.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import { publicUserShape } from '../../ui/default-prop-types.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import { AVATAR_SIZE_BIG, FAVORITE_TYPE } from '../../domain/constants.js';

const DOCUMENTS_BATCH_SIZE = 8;

export default function UserProfile({ PageTemplate, initialState }) {
  const { t } = useTranslation('userProfile');
  const documentApiClient = useService(DocumentApiClient);

  const { user } = initialState;
  const [documents, setDocuments] = useState([]);
  const [fetchingDocuments, setFetchingDocuments] = useDebouncedFetchingState(true);
  const [visibleDocumentsCount, setVisibleDocumentsCount] = useState(DOCUMENTS_BATCH_SIZE);

  useEffect(() => {
    (async () => {
      setFetchingDocuments(true);
      const documentApiClientResponse = await documentApiClient.getPublicNonArchivedDocumentsByContributingUser({ userId: user._id, createdOnly: true });
      setFetchingDocuments(false);
      setDocuments(documentApiClientResponse.documents);
    })();
  }, [user, setFetchingDocuments, documentApiClient]);

  const handleMoreDocumentsClick = () => {
    setVisibleDocumentsCount(visibleDocumentsCount + DOCUMENTS_BATCH_SIZE);
  };

  const renderDocumentCard = (doc, index) => {
    if (index >= visibleDocumentsCount) {
      return null;
    }
    return (
      <DocumentCard doc={doc} key={doc._id} />
    );
  };

  const notShownDocumentsCount = Math.max(documents.length - visibleDocumentsCount, 0);
  const nextBatchSize = Math.min(DOCUMENTS_BATCH_SIZE, notShownDocumentsCount);

  return (
    <PageTemplate contentHeader={<div className="UserProfilePage-contentHeader" />}>
      <div className="UserProfilePage">
        <div className="UserProfilePage-profile">
          <div className="UserProfilePage-profileAvatar">
            <Avatar className="u-avatar" shape="circle" size={AVATAR_SIZE_BIG} src={user.avatarUrl} alt={user.displayName} />
          </div>
          <div className="UserProfilePage-profileButtons">
            <FavoriteToggle type={FAVORITE_TYPE.user} id={user._id} showAsButton />
          </div>
          <div className="UserProfilePage-profileTitle">
            <div className="u-page-title">{user.displayName}</div>
          </div>
          <div className="UserProfilePage-profileOrganization">{user.organization}</div>
          <section className="UserProfilePage-profileOverview">
            <Markdown>{user.profileOverview}</Markdown>
          </section>
        </div>

        {!!user.accountClosedOn && (
          <div className="UserProfilePage-accountClosed">{t('common:accountClosed')}</div>
        )}

        {!!fetchingDocuments && <Spinner />}

        {!fetchingDocuments && !!documents.length && (
          <section className="UserProfilePage-section">
            <div className="UserProfilePage-sectionHeadline">{t('documentsHeadline')}</div>
            <div className="UserProfilePage-sectionCards">
              {documents.map(renderDocumentCard)}
            </div>
            {!!nextBatchSize && (
              <div className="UserProfilePage-sectionMoreButton" >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleMoreDocumentsClick}>
                  {t('moreButton', { count: nextBatchSize })}
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </PageTemplate>
  );
}

UserProfile.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    user: publicUserShape.isRequired
  }).isRequired
};
