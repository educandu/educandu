import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import { Avatar, Card, Tooltip } from 'antd';
import FavoriteStar from './favorite-star.js';
import DeleteButton from './delete-button.js';
import { useTranslation } from 'react-i18next';
import { MailOutlined } from '@ant-design/icons';
import { AVATAR_SIZE, FAVORITE_TYPE } from '../domain/constants.js';

function UserCard({ userId, title, detail, email, avatarUrl, onFavorite, deleteTooltip, onDelete }) {
  const handleCardClick = () => {
    if (userId) {
      window.location = routes.getUserProfileUrl(userId);
    }
  };

  const renderFavoriteAction = () => {
    return (
      <div key="favorite" className="UserCard-favoriteAction">
        <FavoriteStar
          id={userId}
          submitChange={false}
          type={FAVORITE_TYPE.user}
          onToggle={isFavorite => onFavorite(userId, isFavorite)}
          />
      </div>
    );
  };

  const renderDeleteAction = () => {
    return (
      <Tooltip title={deleteTooltip} key="delete">
        <DeleteButton onClick={onDelete} />
      </Tooltip>
    );
  };

  const actions = [];
  if (onFavorite) {
    actions.push(renderFavoriteAction());
  }
  if (onDelete) {
    actions.push(renderDeleteAction());
  }

  return (
    <Card className="UserCard" actions={actions} >
      <div className={classNames('UserCard-content', { 'UserCard-content-clickable': !!userId })} onClick={handleCardClick}>
        <Avatar
          shape="circle"
          size={AVATAR_SIZE}
          className="UserCard-avatar u-avatar"
          src={avatarUrl || urlUtils.getGravatarUrl()}
          />
        <div className="UserCard-title">{title}</div>
        <div className={classNames('UserCard-details', { 'UserCard-details--includesEmail': !!email })}>
          {!!email && (
            <div className="UserCard-email">
              <MailOutlined />
              <a className="UserCard-emailLink" href={`mailto:${encodeURI(email)}`}>{email}</a>
            </div>
          )}
          {detail}
        </div>
      </div>
    </Card>
  );
}

UserCard.propTypes = {
  userId: PropTypes.string,
  email: PropTypes.string,
  title: PropTypes.node.isRequired,
  avatarUrl: PropTypes.string,
  detail: PropTypes.node,
  deleteTooltip: PropTypes.string,
  onFavorite: PropTypes.func,
  onDelete: PropTypes.func
};

UserCard.defaultProps = {
  userId: null,
  email: null,
  avatarUrl: '',
  detail: null,
  deleteTooltip: null,
  onFavorite: null,
  onDelete: null
};

export default UserCard;
