import React from 'react';
import PropTypes from 'prop-types';
import RoomCard from '../room-card.js';
import UserCard from '../user-card.js';
import { Button, Spin, Tooltip } from 'antd';
import DocumentCard from '../document-card.js';
import { useTranslation } from 'react-i18next';
import CloseIcon from '../icons/general/close-icon.js';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import { favoriteDocumentShape, favoriteRoomShape, favoriteUserShape } from '../../ui/default-prop-types.js';

function FavoritesTab({ favoriteUsers, favoriteRooms, favoriteDocuments, loading, onRemoveFavorite }) {
  const { t } = useTranslation('favoritesTab');

  const renderRemoveFavoriteButton = (type, id) => {
    return (
      <Tooltip title={t('common:removeFavorite')}>
        <div className="FavoritesTab-cardRemoveButton">
          <Button
            size="small"
            type="secondary"
            icon={<CloseIcon />}
            onClick={() => onRemoveFavorite(type, id)}
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
      {!!loading && <Spin className="u-spin" /> }
      {!loading && !favoriteUsers.length && !favoriteRooms.length && !favoriteDocuments.length && (
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
  loading: PropTypes.bool.isRequired,
  onRemoveFavorite: PropTypes.func.isRequired
};

export default FavoritesTab;
