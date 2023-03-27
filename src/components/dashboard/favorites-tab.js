import { Spin } from 'antd';
import PropTypes from 'prop-types';
import RoomCard from '../room-card.js';
import UserCard from '../user-card.js';
import FavoriteStar from '../favorite-star.js';
import DocumentCard from '../document-card.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import React, { useEffect, useState } from 'react';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import { favoriteDocumentShape, favoriteRoomShape, favoriteUserShape } from '../../ui/default-prop-types.js';

function FavoritesTab({ favoriteUsers, favoriteRooms, favoriteDocuments, loading }) {
  const { t } = useTranslation('favoritesTab');
  const [favoriteUsersStates, setFavoriteUsersStates] = useState([]);
  const [favoriteRoomsStates, setFavoriteRoomsStates] = useState([]);
  const [favoriteDocumentsStates, setFavoriteDocumentsStates] = useState([]);

  const toggleFavoriteState = (prevState, id, isFavorite) => {
    const newState = cloneDeep(prevState);
    const toggledItem = newState.find(item => item.id === id);
    toggledItem.isFavorite = isFavorite;
    return newState;
  };

  const handleToggleFavoriteUser = (id, isFavorite) => {
    setFavoriteUsersStates(prevState => toggleFavoriteState(prevState, id, isFavorite));
  };

  const handleToggleFavoriteRoom = (id, isFavorite) => {
    setFavoriteRoomsStates(prevState => toggleFavoriteState(prevState, id, isFavorite));
  };

  const handleToggleFavoriteDocument = (id, isFavorite) => {
    setFavoriteDocumentsStates(prevState => toggleFavoriteState(prevState, id, isFavorite));
  };

  useEffect(() => {
    if (!loading) {
      setFavoriteUsersStates(favoriteUsers.map(item => ({ ...item, isFavorite: true })));
      setFavoriteRoomsStates(favoriteRooms.map(item => ({ ...item, isFavorite: true })));
      setFavoriteDocumentsStates(favoriteDocuments.map(item => ({ ...item, isFavorite: true })));
    }
  }, [loading, favoriteUsers, favoriteRooms, favoriteDocuments]);

  const renderFavoriteUserState = favoriteUserState => {
    return (
      <div key={favoriteUserState.id}>
        <UserCard
          user={favoriteUserState.data}
          avatarUrl={favoriteUserState.data.avatarUrl}
          favoritedByCount={favoriteUserState.favoritedByCount}
          onToggleFavorite={handleToggleFavoriteUser}
          />
      </div>
    );
  };

  const renderFavoriteRoomState = favoriteRoomState => {
    return (
      <div className="FavoritesTab-cardWrapper" key={favoriteRoomState.id}>
        <RoomCard
          room={favoriteRoomState.data}
          favoritedByCount={favoriteRoomState.favoritedByCount}
          onToggleFavorite={handleToggleFavoriteRoom}
          />
      </div>
    );
  };

  const renderFavoriteDocumentState = favoriteDocumentState => {
    return (
      <div className="FavoritesTab-cardWrapper" key={favoriteDocumentState.id}>
        <DocumentCard doc={favoriteDocumentState.data} />
        {!favoriteDocumentState.isFavorite && <div className="FavoritesTab-cardOverlay" />}
        <div className="FavoritesTab-favoriteStart" >
          <FavoriteStar
            type={FAVORITE_TYPE.document}
            id={favoriteDocumentState.id}
            submitChange={false}
            onToggle={isFavorite => handleToggleFavoriteDocument(favoriteDocumentState.id, isFavorite)}
            />
        </div>
      </div>
    );
  };

  return (
    <div className="FavoritesTab">
      <div className="FavoritesTab-info">{t('info')}</div>
      {!!loading && <Spin className="u-spin" /> }
      {!loading && !favoriteUsersStates.length && !favoriteRoomsStates.length && !favoriteDocumentsStates.length && (
        <span>{t('noFavorites')}</span>
      )}
      <div className="FavoriteTab-headline">
        {t('favoriteUsers')}
        <div className="FavoriteTab-headlineCounter">
          {`(${favoriteUsersStates.filter(item => item.isFavorite).length})`}
        </div>
      </div>
      <section className="FavoritesTab-cards FavoritesTab-cards--small">
        {favoriteUsersStates.map(renderFavoriteUserState)}
      </section>
      <div className="FavoriteTab-headline">
        {t('favoriteRooms')}
        <div className="FavoriteTab-headlineCounter">
          {`(${favoriteRoomsStates.filter(item => item.isFavorite).length})`}
        </div>
      </div>
      <section className="FavoritesTab-cards FavoritesTab-cards--small">
        {favoriteRoomsStates.map(renderFavoriteRoomState)}
      </section>
      <div className="FavoriteTab-headline">
        {t('favoriteDocuments')}
        <div className="FavoriteTab-headlineCounter">
          {`(${favoriteDocumentsStates.filter(item => item.isFavorite).length})`}
        </div>
      </div>
      <section className="FavoritesTab-cards FavoritesTab-cards--wide">
        {favoriteDocumentsStates.map(renderFavoriteDocumentState)}
      </section>
    </div>
  );
}

FavoritesTab.propTypes = {
  favoriteUsers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    setOn: PropTypes.string.isRequired,
    data: favoriteUserShape.isRequired
  })).isRequired,
  favoriteRooms: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    setOn: PropTypes.string.isRequired,
    data: favoriteRoomShape.isRequired
  })).isRequired,
  favoriteDocuments: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    setOn: PropTypes.string.isRequired,
    data: favoriteDocumentShape.isRequired
  })).isRequired,
  loading: PropTypes.bool.isRequired
};

export default FavoritesTab;
