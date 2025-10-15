import by from 'thenby';
import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import RoomCard from '../room-card.js';
import UserCard from '../user-card.js';
import EmptyState from '../empty-state.js';
import DocumentCard from '../document-card.js';
import { useTranslation } from 'react-i18next';
import { FavoriteIcon } from '../icons/icons.js';
import cloneDeep from '../../utils/clone-deep.js';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { favoriteItemWithDataShape } from '../../ui/default-prop-types.js';

function createDisplayData(favorites) {
  const sortedFavorites = favorites.map(item => ({ ...item, isFavorite: true })).sort(by(f => f.setOn, 'desc'));
  return {
    favoriteUsersStates: sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.user),
    favoriteRoomsStates: sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.room),
    favoriteDocumentsStates: sortedFavorites.filter(favorite => favorite.type === FAVORITE_TYPE.document)
  };
}

function FavoritesTab({ favorites, loading }) {
  const lastLoadingState = useRef(loading);
  const { t } = useTranslation('favoritesTab');
  const [displayData, setDisplayData] = useState(() => createDisplayData(favorites));

  useEffect(() => {
    if (loading !== lastLoadingState.current) {
      setDisplayData(loading ? [] : createDisplayData(favorites));
      lastLoadingState.current = loading;
    }
  }, [favorites, loading]);

  const toggleFavoriteState = (prevState, id, isFavorite) => {
    const newState = cloneDeep(prevState);
    const toggledItem = newState.find(item => item.id === id);
    toggledItem.isFavorite = isFavorite;
    return newState;
  };

  const handleToggleFavoriteUser = (id, isFavorite) => {
    setDisplayData(oldDisplayData => ({
      ...oldDisplayData,
      favoriteUsersStates: toggleFavoriteState(oldDisplayData.favoriteUsersStates, id, isFavorite)
    }));
  };

  const handleToggleFavoriteRoom = (id, isFavorite) => {
    setDisplayData(oldDisplayData => ({
      ...oldDisplayData,
      favoriteRoomsStates: toggleFavoriteState(oldDisplayData.favoriteRoomsStates, id, isFavorite)
    }));
  };

  const handleToggleFavoriteDocument = (id, isFavorite) => {
    setDisplayData(oldDisplayData => ({
      ...oldDisplayData,
      favoriteDocumentsStates: toggleFavoriteState(oldDisplayData.favoriteDocumentsStates, id, isFavorite)
    }));
  };

  const renderFavoriteUserState = favoriteUserState => {
    return (
      <div key={favoriteUserState.id}>
        <UserCard
          favoriteUser={favoriteUserState}
          onToggleFavorite={handleToggleFavoriteUser}
          />
      </div>
    );
  };

  const renderFavoriteRoomState = favoriteRoomState => {
    return (
      <div key={favoriteRoomState.id}>
        <RoomCard
          favoriteRoom={favoriteRoomState}
          onToggleFavorite={handleToggleFavoriteRoom}
          />
      </div>
    );
  };

  const renderFavoriteDocumentState = favoriteDocumentState => {
    return (
      <div key={favoriteDocumentState.id}>
        <DocumentCard
          favoriteDocument={favoriteDocumentState}
          onToggleFavorite={handleToggleFavoriteDocument}
          />
      </div>
    );
  };

  const hasData = displayData.favoriteUsersStates.length
    || displayData.favoriteRoomsStates.length
    || displayData.favoriteDocumentsStates.length;

  return (
    <div className="FavoritesTab">
      {!!loading && <Spinner />}
      {!loading && !hasData && (
        <EmptyState icon={<FavoriteIcon />} title={t('emptyStateTitle')} subtitle={t('emptyStateSubtitle')} />
      )}
      {!loading && !!hasData && (
        <Fragment>
          {!!displayData.favoriteUsersStates.length && (
            <Fragment>
              <div className="FavoriteTab-headline">
                {t('favoriteUsers')}
                <div className="FavoriteTab-headlineCounter">
                  {`(${displayData.favoriteUsersStates.filter(item => item.isFavorite).length})`}
                </div>
              </div>
              <section className="FavoritesTab-cards">
                {displayData.favoriteUsersStates.map(renderFavoriteUserState)}
                {!displayData.favoriteUsersStates.length && <div className="FavoritesTab-noContent">{t('sectionPlaceholder')}</div>}
              </section>
            </Fragment>
          )}

          {!!displayData.favoriteRoomsStates.length && (
            <Fragment>
              <div className="FavoriteTab-headline">
                {t('favoriteRooms')}
                <div className="FavoriteTab-headlineCounter">
                  {`(${displayData.favoriteRoomsStates.filter(item => item.isFavorite).length})`}
                </div>
              </div>
              <section className="FavoritesTab-cards">
                {displayData.favoriteRoomsStates.map(renderFavoriteRoomState)}
                {!displayData.favoriteRoomsStates.length && <div className="FavoritesTab-noContent">{t('sectionPlaceholder')}</div>}
              </section>
            </Fragment>
          )}

          {!!displayData.favoriteDocumentsStates.length && (
            <Fragment>
              <div className="FavoriteTab-headline">
                {t('favoriteDocuments')}
                <div className="FavoriteTab-headlineCounter">
                  {`(${displayData.favoriteDocumentsStates.filter(item => item.isFavorite).length})`}
                </div>
              </div>
              <section className="FavoritesTab-cards">
                {displayData.favoriteDocumentsStates.map(renderFavoriteDocumentState)}
                {!displayData.favoriteDocumentsStates.length && <div className="FavoritesTab-noContent">{t('sectionPlaceholder')}</div>}
              </section>
            </Fragment>
          )}
        </Fragment>
      )}
    </div>
  );
}

FavoritesTab.propTypes = {
  favorites: PropTypes.arrayOf(favoriteItemWithDataShape).isRequired,
  loading: PropTypes.bool.isRequired
};

export default FavoritesTab;
