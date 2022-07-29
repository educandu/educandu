import by from 'thenby';
import { Avatar } from 'antd';
import RoomCard from './room-card.js';
import Logger from '../common/logger.js';
import DocumentCard from './document-card.js';
import FavoriteStar from './favorite-star.js';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '../ui/error-helper.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { AVATAR_SIZE, FAVORITE_TYPE } from '../domain/constants.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import routes from '../utils/routes.js';

const logger = new Logger(import.meta.url);

function FavoritesTab() {
  const { t } = useTranslation('favoritesTab');
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const [favoriteUsers, setFavoriteUsers] = useState([]);
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);

  const updateFavorites = useCallback(async () => {
    try {
      const data = await userApiClient.getFavorites();
      const sortedFavorites = data.favorites.sort(by(f => f.setOn, 'desc'));
      setFavoriteUsers(sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.user));
      setFavoriteRooms(sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.room));
      setFavoriteDocuments(sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.document));
    } catch (error) {
      handleApiError({ error, logger, t });
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

  const handleFavoriteUserClick = favoriteUser => {
    window.location = routes.getUserUrl(favoriteUser.id);
  };

  const renderFavoriteUser = favoriteUser => {
    return (
      <div className="FavoritesTab-cardWrapper" key={favoriteUser.id}>
        <div className="FavoritesTab-userCard">
          <div className="FavoritesTab-userCardAvatar">
            <Avatar
              className="Avatar"
              shape="circle"
              size={AVATAR_SIZE}
              src={favoriteUser.data.avatarUrl}
              alt={favoriteUser.data.displayName}
              />
          </div>
          <div className="FavoritesTab-userCardTitle" onClick={() => handleFavoriteUserClick(favoriteUser)}>{favoriteUser.data.displayName}</div>
        </div>
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
      <div className="FavoritesTab-cardWrapper" key={favoriteDocument.id}>
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
      {!!favoriteUsers.length && (
        <Fragment>
          <div className="FavoriteTab-headline">{t('favoriteUsers')}</div>
          <section className="FavoritesTab-cards">
            {favoriteUsers.map(renderFavoriteUser)}
          </section>
        </Fragment>
      )}
      {!!favoriteRooms.length && (
        <Fragment>
          <div className="FavoriteTab-headline">{t('favoriteRooms')}</div>
          <section className="FavoritesTab-cards">
            {favoriteRooms.map(renderFavoriteRoom)}
          </section>
        </Fragment>
      )}
      {!!favoriteDocuments.length && (
        <Fragment>
          <div className="FavoriteTab-headline">{t('favoriteDocuments')}</div>
          <section className="FavoritesTab-cards">
            {favoriteDocuments.map(renderFavoriteDocument)}
          </section>
        </Fragment>
      )}
    </div>
  );
}

export default FavoritesTab;
