import { Spin } from 'antd';
import PropTypes from 'prop-types';
import RoomCard from '../room-card.js';
import UserCard from '../user-card.js';
import DocumentCard from '../document-card.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import React, { useEffect, useState } from 'react';
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
          favoriteUser={favoriteUserState}
          avatarUrl={favoriteUserState.data.avatarUrl}
          favoritedByCount={favoriteUserState.favoritedByCount}
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
          favoritedByCount={favoriteRoomState.favoritedByCount}
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
          // change
          favoritedByCount={favoriteDocumentState.favoritedByCount}
          onToggleFavorite={handleToggleFavoriteDocument}
          />
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
    data: favoriteRoomShape
  })).isRequired,
  favoriteDocuments: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    setOn: PropTypes.string.isRequired,
    data: favoriteDocumentShape
  })).isRequired,
  loading: PropTypes.bool.isRequired
};

export default FavoritesTab;
