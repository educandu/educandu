import by from 'thenby';
import { Spin } from 'antd';
import RoomCard from './room-card.js';
import UserCard from './user-card.js';
import Logger from '../common/logger.js';
import DocumentCard from './document-card.js';
import FavoriteStar from './favorite-star.js';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '../ui/error-helper.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import React, { useCallback, useEffect, useState } from 'react';

const logger = new Logger(import.meta.url);

function FavoritesTab() {
  const { t } = useTranslation('favoritesTab');
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const [favoriteUsers, setFavoriteUsers] = useState([]);
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);
  const [fetchingFavorites, setFetchingFavorites] = useState(true);

  const updateFavorites = useCallback(async () => {
    try {
      setFetchingFavorites(true);
      const data = await userApiClient.getFavorites();
      const sortedFavorites = data.favorites.sort(by(f => f.setOn, 'desc'));
      setFavoriteUsers(sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.user));
      setFavoriteRooms(sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.room));
      setFavoriteDocuments(sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.document));
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setFetchingFavorites(false);
    }
  }, [userApiClient, t]);

  useEffect(() => {
    (async () => {
      await updateFavorites();
    })();
  }, [updateFavorites]);

  const handleFavoriteStarToggle = async () => {
    await updateFavorites();
  };

  const renderFavoriteUser = favoriteUser => {
    return (
      <div className="FavoritesTab-cardWrapper" key={favoriteUser.id}>
        <UserCard
          userId={favoriteUser.id}
          displayName={favoriteUser.data.displayName}
          avatarUrl={favoriteUser.data.avatarUrl}
          />
        <div className="FavoritesTab-cardStar">
          <FavoriteStar type={FAVORITE_TYPE.user} id={favoriteUser.id} onToggle={handleFavoriteStarToggle} />
        </div>
      </div>
    );
  };

  const renderFavoriteRoom = favoriteRoom => {
    return (
      <div className="FavoritesTab-cardWrapper" key={favoriteRoom.id}>
        <RoomCard room={favoriteRoom.data} alwaysRenderOwner />
        <div className="FavoritesTab-cardStar">
          <FavoriteStar type={FAVORITE_TYPE.room} id={favoriteRoom.id} onToggle={handleFavoriteStarToggle} />
        </div>
      </div>
    );
  };

  const renderFavoriteDocument = favoriteDocument => {
    return (
      <div className="FavoritesTab-cardWrapper FavoritesTab-cardWrapper--document" key={favoriteDocument.id}>
        <DocumentCard doc={favoriteDocument.data} />
        <div className="FavoritesTab-cardStar">
          <FavoriteStar type={FAVORITE_TYPE.document} id={favoriteDocument.id} onToggle={handleFavoriteStarToggle} />
        </div>
      </div>
    );
  };

  return (
    <div className="FavoritesTab">
      <div className="FavoritesTab-info">{t('info')}</div>
      {!!fetchingFavorites && <Spin className="u-spin" /> }
      {!fetchingFavorites && !favoriteUsers.length && !favoriteRooms.length && !favoriteDocuments.length && (
        <span>{t('noFavorites')}</span>
      )}
      <div className="FavoriteTab-headline">{t('favoriteUsers', { count: favoriteUsers.length })}</div>
      <section className="FavoritesTab-cards">
        {favoriteUsers.map(renderFavoriteUser)}
      </section>
      <div className="FavoriteTab-headline">{t('favoriteRooms', { count: favoriteRooms.length })}</div>
      <section className="FavoritesTab-cards">
        {favoriteRooms.map(renderFavoriteRoom)}
      </section>
      <div className="FavoriteTab-headline">{t('favoriteDocuments', { count: favoriteDocuments.length })}</div>
      <section className="FavoritesTab-cards">
        {favoriteDocuments.map(renderFavoriteDocument)}
      </section>
    </div>
  );
}

export default FavoritesTab;
