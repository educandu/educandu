import React from 'react';
import { Avatar } from 'antd';
import PropTypes from 'prop-types';
import { MailOutlined } from '@ant-design/icons';
import { AVATAR_SIZE } from '../domain/constants.js';

export default function ProfileHeader({ avatarUrl, displayName, organization, email, includeMailTo }) {
  return (
    <section className="ProfileHeader">
      <div className="ProfileHeader-avatar">
        <Avatar className="u-avatar" shape="circle" size={AVATAR_SIZE} src={avatarUrl} alt={displayName} />
      </div>
      <div>
        <span className="ProfileHeader-displayName">{displayName}</span>
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
  avatarUrl: PropTypes.string,
  displayName: PropTypes.string.isRequired,
  email: PropTypes.string,
  organization: PropTypes.string,
  includeMailTo: PropTypes.bool
};

ProfileHeader.defaultProps = {
  avatarUrl: null,
  email: null,
  organization: null,
  includeMailTo: false
};
