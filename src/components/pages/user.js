import React from 'react';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import ProfileHeader from '../profile-header.js';
import { publicUserShape } from '../../ui/default-prop-types.js';

export default function User({ PageTemplate, initialState }) {
  const { user } = initialState;

  return (
    <PageTemplate>
      <div className="UserPage">
        <ProfileHeader
          email={user.email}
          avatarUrl={user.avatarUrl}
          displayName={user.displayName}
          organization={user.organization}
          />

        {!!user.introduction && (
          <section className="UserPage-introduction">
            <Markdown renderMedia>{user.introduction}</Markdown>
          </section>
        )}
      </div>
    </PageTemplate>
  );
}

User.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    user: publicUserShape.isRequired
  }).isRequired
};
