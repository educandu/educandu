import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import StarIcon from './icons/general/star-icon.js';
import { handleApiError } from '../ui/error-helper.js';
import { useSetUser, useUser } from './user-context.js';
import { getCurrentUrl } from '../ui/browser-helper.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const logger = new Logger(import.meta.url);

function getIsSet(user, type, id) {
  return !!user?.favorites.find(x => x.type === type && x.id === id);
}

function FavoriteStar({ type, id, tooltipPlacement, disabled, onToggle, submitChange }) {
  const user = useUser();
  const setUser = useSetUser();
  const { t } = useTranslation('favoriteStar');
  const [isSet, setIsSet] = useState(getIsSet(user, type, id));
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  useEffect(() => {
    setIsSet(getIsSet(user, type, id));
  }, [user, type, id]);

  const handleClick = async () => {
    if (disabled) {
      return;
    }

    if (!user) {
      window.location = routes.getLoginUrl(getCurrentUrl());
    }

    const newIsSet = !isSet;
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

  const classes = classNames(
    'FavoriteStar',
    { 'is-filled': isSet },
    { 'is-disabled': disabled }
  );

  return (
    <Tooltip placement={tooltipPlacement} title={isSet ? t('common:removeFavorite') : t('common:addFavorite')}>
      <div className={classes} onClick={handleClick}>
        <StarIcon isFilled={isSet} />
      </div>
    </Tooltip>
  );
}

FavoriteStar.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  tooltipPlacement: PropTypes.string,
  submitChange: PropTypes.bool,
  onToggle: PropTypes.func
};

FavoriteStar.defaultProps = {
  disabled: false,
  tooltipPlacement: 'top',
  submitChange: true,
  onToggle: () => {}
};

export default FavoriteStar;
