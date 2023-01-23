import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Button } from 'antd';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { AVATAR_SIZE } from '../domain/constants.js';

function UserCard({ userId, displayName, avatarUrl }) {
  const { t } = useTranslation('userCard');

  const handleButtonClick = () => {
    window.location = routes.getUserUrl(userId);
  };

  return (
    <div className="UserCard">
      <div>{displayName}</div>
      <div>
        <Avatar className="Avatar" shape="circle" size={AVATAR_SIZE} src={avatarUrl} />
      </div>
      <Button type="primary" className="UserCard-button" onClick={handleButtonClick} disabled={!userId}>
        {t('profileButton')}
      </Button>
    </div>
  );
}

UserCard.propTypes = {
  userId: PropTypes.string,
  avatarUrl: PropTypes.string,
  displayName: PropTypes.string.isRequired
};

UserCard.defaultProps = {
  userId: null,
  avatarUrl: ''
};

export default UserCard;
