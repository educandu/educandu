import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import { FavoriteIcon } from './icons/icons.js';
import { useGetCurrentUrl } from '../ui/hooks.js';
import { handleApiError } from '../ui/error-helper.js';
import { useSetUser, useUser } from './user-context.js';
import React, { Fragment, useEffect, useState } from 'react';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const logger = new Logger(import.meta.url);

function getIsSet(user, type, id) {
  return !!user?.favorites.find(x => x.type === type && x.id === id);
}

function FavoriteToggle({ type, id, useTooltip, disabled, onToggle }) {
  const user = useUser();
  const setUser = useSetUser();
  const getCurrentUrl = useGetCurrentUrl();
  const { t } = useTranslation('favoriteToggle');
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
      window.location = routes.getLoginUrl({ currentUrl: getCurrentUrl() });
    }

    const newIsSet = !isSet;
    setIsSet(newIsSet);
    try {
      const updatedUser = newIsSet
        ? await userApiClient.addFavorite({ type, id })
        : await userApiClient.removeFavorite({ type, id });

      onToggle(newIsSet);
      setUser(updatedUser);
    } catch (error) {
      handleApiError({ error, t, logger });
      setIsSet(!newIsSet);
    }
  };

  const classes = classNames(
    'FavoriteToggle',
    { 'is-set': isSet },
    { 'is-disabled': disabled }
  );

  const renderFavoriteIcon = () => (
    <div className={classes} onClick={handleClick}>
      <FavoriteIcon fill={isSet ? 'currentColor' : 'none'} />
    </div>
  );

  return (
    <Fragment>
      {!!useTooltip && (
        <Tooltip title={isSet ? t('common:removeFavorite') : t('common:addFavorite')}>
          {renderFavoriteIcon()}
        </Tooltip>
      )}
      {!useTooltip && renderFavoriteIcon()}
    </Fragment>
  );
}

FavoriteToggle.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  useTooltip: PropTypes.bool,
  onToggle: PropTypes.func
};

FavoriteToggle.defaultProps = {
  disabled: false,
  useTooltip: true,
  onToggle: () => {}
};

export default FavoriteToggle;
