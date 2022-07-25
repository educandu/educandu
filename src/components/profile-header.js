import React from 'react';
import { Avatar } from 'antd';
import PropTypes from 'prop-types';
import { AVATAR_SIZE } from '../domain/constants.js';

export default function ProfileHeader({ avatarUrl, displayName, organization, email }) {
  return (
    <section className="ProfileHeader">
      <div className="ProfileHeader-avatar">
        <Avatar className="Avatar" shape="circle" size={AVATAR_SIZE} src={avatarUrl} alt={displayName} />
      </div>
      <div>
        <span className="ProfileHeader-displayName">{displayName}</span>
        <span className="ProfileHeader-organization">{organization}</span>
        <span className="ProfileHeader-email">{email}</span>
      </div>
    </section>
  );
}

ProfileHeader.propTypes = {
  avatarUrl: PropTypes.string,
  displayName: PropTypes.string.isRequired,
  email: PropTypes.string,
  organization: PropTypes.string
};

ProfileHeader.defaultProps = {
  avatarUrl: null,
  email: null,
  organization: null
};
