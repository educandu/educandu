import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Button } from 'antd';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import { useTranslation } from 'react-i18next';
import { MailOutlined } from '@ant-design/icons';
import { AVATAR_SIZE } from '../domain/constants.js';

function UserCard({ userId, displayName, email, avatarUrl, detail }) {
  const { t } = useTranslation('userCard');

  const handleButtonClick = () => {
    window.location = routes.getUserProfileUrl(userId);
  };

  return (
    <div className="UserCard">
      <div>
        <div className="UserCard-displayName">{displayName}</div>
        {!!email && (
          <div className="UserCard-email">
            <MailOutlined />
            <a className="UserCard-emailLink" href={`mailto:${encodeURI(email)}`}>{email}</a>
          </div>
        )}
      </div>
      <div className="UserCard-content">
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
  email: PropTypes.string,
  displayName: PropTypes.node.isRequired,
  avatarUrl: PropTypes.string,
  detail: PropTypes.node
};

UserCard.defaultProps = {
  userId: null,
  email: null,
  avatarUrl: '',
  detail: null
};

export default UserCard;
