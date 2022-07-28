import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FavoriteStar from '../favorite-star.js';
import ProfileHeader from '../profile-header.js';
import MinimalRoomCard from '../minimal-room-card.js';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import MinimalDocumentCard from '../minimal-document-card.js';
import { documentMetadataShape, publicUserShape, roomMetadataShape } from '../../ui/default-prop-types.js';

const CARD_BATCH_SIZE = 8;

export default function User({ PageTemplate, initialState }) {
  const { t } = useTranslation('user');
  const { user, documents, rooms } = initialState;

  const [visibleRoomsCount, setVisibleRoomsCount] = useState(CARD_BATCH_SIZE);
  const [visibleDocumentsCount, setVisibleDocumentsCount] = useState(CARD_BATCH_SIZE);

  const handleMoreDocumentsClick = () => {
    setVisibleDocumentsCount(visibleDocumentsCount + CARD_BATCH_SIZE);
  };

  const handleMoreRoomsClick = () => {
    setVisibleRoomsCount(visibleRoomsCount + CARD_BATCH_SIZE);
  };

  const renderDocumentCard = (doc, index) => {
    if (index >= visibleDocumentsCount) {
      return null;
    }
    return (
      <div key={doc._id}>
        <MinimalDocumentCard doc={doc} />
      </div>
    );
  };

  const renderRoomCard = (room, index) => {
    if (index >= visibleRoomsCount) {
      return null;
    }
    return (
      <div key={room._id}>
        <MinimalRoomCard room={room} />
      </div>
    );
  };

  return (
    <PageTemplate>
      <div className="UserPage">
        <div className="UserPage-header">
          <div className="UserPage-headerProfile">
            <ProfileHeader
              email={user.email}
              avatarUrl={user.avatarUrl}
              displayName={user.displayName}
              organization={user.organization}
              />
          </div>
          <div className="UserPage-headerStar">
            <FavoriteStar type={FAVORITE_TYPE.user} id={user._id} />
          </div>
        </div>

        {!!user.introduction && (
          <section className="UserPage-introduction">
            <Markdown renderMedia>{user.introduction}</Markdown>
          </section>
        )}

        {!!user.accountClosedOn && (
          <div className="UserPage-accountClosed">{t('accountClosed')}</div>
        )}

        {!!rooms.length && (
          <section>
            <div className="UserPage-sectionHeadline">{t('roomsHeadline')}</div>
            <div className="UserPage-sectionCards">
              {rooms.map(renderRoomCard)}
            </div>
            {visibleRoomsCount < rooms.length && (
              <a className="UserPage-sectionLink" onClick={handleMoreRoomsClick}>{t('loadMore')}</a>
            )}
          </section>
        )}

        {!!documents.length && (
          <section>
            <div className="UserPage-sectionHeadline">{t('documentsHeadline')}</div>
            <div className="UserPage-sectionCards">
              {documents.map(renderDocumentCard)}
            </div>
            {visibleDocumentsCount < documents.length && (
              <a className="UserPage-sectionLink" onClick={handleMoreDocumentsClick}>{t('loadMore')}</a>
            )}
          </section>
        )}
      </div>
    </PageTemplate>
  );
}

User.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    user: publicUserShape.isRequired,
    rooms: PropTypes.arrayOf(roomMetadataShape).isRequired,
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired
  }).isRequired
};
