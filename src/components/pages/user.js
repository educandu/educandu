import React from 'react';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import { useTranslation } from 'react-i18next';
import FavoriteStar from '../favorite-star.js';
import ProfileHeader from '../profile-header.js';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import { publicUserShape } from '../../ui/default-prop-types.js';

export default function User({ PageTemplate, initialState }) {
  const { user } = initialState;
  const { t } = useTranslation('user');

  return (
    <PageTemplate>
      <div className="UserPage">
        <div className="UserPage-header">
          <div className="UserPage-headerProfile">
            <ProfileHeader
              email={user.email}
              avatarUrl={user.avatarUrl}
              displayName={user.displayName}
              organization={user.organization}
              />
          </div>
          <div className="UserPage-headerStar">
            <FavoriteStar type={FAVORITE_TYPE.user} id={user._id} />
          </div>
        </div>

        {!!user.introduction && (
          <section className="UserPage-introduction">
            <Markdown renderMedia>{user.introduction}</Markdown>
          </section>
        )}

        {!!user.accountClosedOn && (
          <div className="UserPage-accountClosed">{t('accountClosed')}</div>
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
