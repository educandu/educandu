import PropTypes from 'prop-types';
import { Button, Spin } from 'antd';
import Markdown from '../markdown.js';
import { useTranslation } from 'react-i18next';
import FavoriteStar from '../favorite-star.js';
import DocumentCard from '../document-card.js';
import ProfileHeader from '../profile-header.js';
import { PlusOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import { publicUserShape } from '../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';

const DOCUMENTS_BATCH_SIZE = 8;

export default function UserProfile({ PageTemplate, initialState }) {
  const { t } = useTranslation('userProfile');
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const { user } = initialState;
  const [documents, setDocuments] = useState([]);
  const [fetchingDocuments, setFetchingDocuments] = useState(true);
  const [visibleDocumentsCount, setVisibleDocumentsCount] = useState(DOCUMENTS_BATCH_SIZE);

  useEffect(() => {
    (async () => {
      setFetchingDocuments(true);
      const userApiClientResponse = await userApiClient.getCreatedDocuments({ userId: user._id });
      setFetchingDocuments(false);
      setDocuments(userApiClientResponse.documents);
    })();
  }, [user, userApiClient]);

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
    <PageTemplate>
      <div className="UserProfilePage">
        <div className="UserProfilePage-header">
          <div className="UserProfilePage-headerProfile">
            <ProfileHeader
              includeMailTo
              email={user.email}
              avatarUrl={user.avatarUrl}
              displayName={user.displayName}
              organization={user.organization}
              />
          </div>
          <div className="UserProfilePage-headerStar">
            <FavoriteStar type={FAVORITE_TYPE.user} id={user._id} />
          </div>
        </div>

        {!!user.introduction && (
          <section className="UserProfilePage-introduction">
            <Markdown>{user.introduction}</Markdown>
          </section>
        )}

        {!!user.accountClosedOn && (
          <div className="UserProfilePage-accountClosed">{t('accountClosed')}</div>
        )}

        {!!fetchingDocuments && <Spin className="u-spin" />}

        {!fetchingDocuments && !!documents.length && (
          <section>
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
