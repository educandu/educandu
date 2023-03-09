import React from 'react';
import { Avatar } from 'antd';
import PropTypes from 'prop-types';
import FavoriteStar from './favorite-star.js';
import { MailOutlined } from '@ant-design/icons';
import { AVATAR_SIZE, FAVORITE_TYPE } from '../domain/constants.js';

export default function ProfileHeader({ userId, avatarUrl, displayName, organization, email, includeMailTo, includeFavoriteStar }) {
  return (
    <section className="ProfileHeader">
      <div className="ProfileHeader-avatar">
        <Avatar className="u-avatar" shape="circle" size={AVATAR_SIZE} src={avatarUrl} alt={displayName} />
      </div>
      <div>
        <span className="ProfileHeader-displayName">
          {displayName}
          {!!includeFavoriteStar && (
            <div className="ProfileHeader-star">
              <FavoriteStar type={FAVORITE_TYPE.user} id={userId} />
            </div>
          )}
        </span>
        {!!organization && (
          <span className="ProfileHeader-organization">{organization}</span>
        )}
        {!!email && (
          <div className="ProfileHeader-email">
            <MailOutlined />
            {!includeMailTo && email}
            {!!includeMailTo && <a className="ProfileHeader-emailLink" href={`mailto:${encodeURI(email)}`}>{email}</a>}
          </div>
        )}
      </div>
    </section>
  );
}

ProfileHeader.propTypes = {
  userId: PropTypes.string,
  avatarUrl: PropTypes.string,
  displayName: PropTypes.string.isRequired,
  email: PropTypes.string,
  organization: PropTypes.string,
  includeMailTo: PropTypes.bool,
  includeFavoriteStar: PropTypes.bool
};

ProfileHeader.defaultProps = {
  userId: null,
  avatarUrl: null,
  email: null,
  organization: null,
  includeMailTo: false,
  includeFavoriteStar: false
};
