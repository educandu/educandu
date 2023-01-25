import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Button } from 'antd';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import { useTranslation } from 'react-i18next';
import { AVATAR_SIZE } from '../domain/constants.js';

function UserCard({ userId, displayName, avatarUrl, detail }) {
  const { t } = useTranslation('userCard');

  const handleButtonClick = () => {
    window.location = routes.getUserUrl(userId);
  };

  return (
    <div className="UserCard">
      <div className="UserCard-displayName">{displayName}</div>
      <div className="UserCard-avatarWrapper">
        <Avatar
          shape="circle"
          size={AVATAR_SIZE}
          className="UserCard-avatar u-avatar"
          src={avatarUrl || urlUtils.getGravatarUrl()}
          />
        {detail}
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
  displayName: PropTypes.string.isRequired,
  detail: PropTypes.node
};

UserCard.defaultProps = {
  userId: null,
  avatarUrl: '',
  detail: null
};

export default UserCard;
