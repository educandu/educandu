import by from 'thenby';
import RoomCard from '../room-card.js';
import UserCard from '../user-card.js';
import Logger from '../../common/logger.js';
import { Button, Spin, Tooltip } from 'antd';
import DocumentCard from '../document-card.js';
import { useTranslation } from 'react-i18next';
import CloseIcon from '../icons/general/close-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import React, { useCallback, useEffect, useState } from 'react';
import UserApiClient from '../../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';

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

  const handleFavoriteRemoveClick = async (type, id) => {
    await userApiClient.removeFavorite({ type, id });
    await updateFavorites();
  };

  const renderRemoveFavoriteButton = (type, id) => {
    return (
      <Tooltip title={t('common:removeFavorite')}>
        <div className="FavoritesTab-cardRemoveButton">
          <Button
            size="small"
            type="secondary"
            icon={<CloseIcon />}
            onClick={() => handleFavoriteRemoveClick(type, id)}
            />
        </div>
      </Tooltip>
    );
  };

  const renderFavoriteUser = favoriteUser => {
    return (
      <div className="FavoritesTab-cardWrapper" key={favoriteUser.id}>
        <UserCard
          userId={favoriteUser.id}
          displayName={favoriteUser.data.displayName}
          avatarUrl={favoriteUser.data.avatarUrl}
          />
        {renderRemoveFavoriteButton(FAVORITE_TYPE.user, favoriteUser.id)}
      </div>
    );
  };

  const renderFavoriteRoom = favoriteRoom => {
    return (
      <div className="FavoritesTab-cardWrapper" key={favoriteRoom.id}>
        <RoomCard room={favoriteRoom.data} alwaysRenderOwner />
        {renderRemoveFavoriteButton(FAVORITE_TYPE.room, favoriteRoom.id)}
      </div>
    );
  };

  const renderFavoriteDocument = favoriteDocument => {
    return (
      <div className="FavoritesTab-cardWrapper" key={favoriteDocument.id}>
        <DocumentCard doc={favoriteDocument.data} />
        {renderRemoveFavoriteButton(FAVORITE_TYPE.document, favoriteDocument.id)}
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
      <section className="FavoritesTab-cards FavoritesTab-cards--small">
        {favoriteUsers.map(renderFavoriteUser)}
      </section>
      <div className="FavoriteTab-headline">{t('favoriteRooms', { count: favoriteRooms.length })}</div>
      <section className="FavoritesTab-cards FavoritesTab-cards--small">
        {favoriteRooms.map(renderFavoriteRoom)}
      </section>
      <div className="FavoriteTab-headline">{t('favoriteDocuments', { count: favoriteDocuments.length })}</div>
      <section className="FavoritesTab-cards FavoritesTab-cards--wide">
        {favoriteDocuments.map(renderFavoriteDocument)}
      </section>
    </div>
  );
}

export default FavoritesTab;
