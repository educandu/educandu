import { Rate } from 'antd';
import PropTypes from 'prop-types';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { handleApiError } from '../ui/error-helper.js';
import { useSetUser, useUser } from './user-context.js';
import { getCurrentUrl } from '../ui/browser-helper.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const logger = new Logger(import.meta.url);

function getIsSet(user, type, id) {
  return !!user?.favorites.find(x => x.type === type && x.id === id);
}

function FavoriteStar({ type, id, disabled, onToggle, submitChange }) {
  const user = useUser();
  const setUser = useSetUser();
  const { t } = useTranslation('favoriteStar');
  const [isSet, setIsSet] = useState(getIsSet(user, type, id));
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  useEffect(() => {
    setIsSet(getIsSet(user, type, id));
  }, [user, type, id]);

  const handleChange = async value => {
    if (!user) {
      window.location = routes.getLoginUrl(getCurrentUrl());
    }

    const newIsSet = value === 1;
    setIsSet(newIsSet);
    try {
      if (submitChange) {
        const newUser = newIsSet
          ? await userApiClient.addFavorite({ type, id })
          : await userApiClient.removeFavorite({ type, id });

        setUser(newUser);
      }

      onToggle(newIsSet);
    } catch (error) {
      handleApiError({ error, t, logger });
      setIsSet(!newIsSet);
    }
  };

  return (
    <div className="FavoriteStar">
      <Rate
        className="FavoriteStar-rate"
        count={1}
        value={isSet ? 1 : 0}
        onChange={handleChange}
        tooltips={[t(isSet ? 'common:removeFavorite' : 'common:addFavorite')]}
        disabled={disabled}
        />
    </div>
  );
}

FavoriteStar.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  submitChange: PropTypes.bool,
  onToggle: PropTypes.func
};

FavoriteStar.defaultProps = {
  disabled: false,
  submitChange: true,
  onToggle: null
};

export default FavoriteStar;
