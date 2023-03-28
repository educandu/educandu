import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import StarIcon from './icons/general/star-icon.js';
import { handleApiError } from '../ui/error-helper.js';
import { getCurrentUrl } from '../ui/browser-helper.js';
import React, { Fragment, useEffect, useState } from 'react';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const logger = new Logger(import.meta.url);

function getIsSet(user, type, id) {
  return !!user?.favorites.find(x => x.type === type && x.id === id);
}

function FavoriteStar({ type, id, useTooltip, disabled, onToggle }) {
  const user = useUser();
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
      if (newIsSet) {
        await userApiClient.addFavorite({ type, id });
      } else {
        await userApiClient.removeFavorite({ type, id });
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

  const renderStar = () => (
    <div className={classes} onClick={handleClick}>
      <StarIcon isFilled={isSet} />
    </div>
  );

  return (
    <Fragment>
      {!!useTooltip && (
        <Tooltip title={isSet ? t('common:removeFavorite') : t('common:addFavorite')}>
          {renderStar()}
        </Tooltip>
      )}
      {!useTooltip && renderStar()}
    </Fragment>
  );
}

FavoriteStar.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  useTooltip: PropTypes.bool,
  onToggle: PropTypes.func
};

FavoriteStar.defaultProps = {
  disabled: false,
  useTooltip: true,
  onToggle: () => {}
};

export default FavoriteStar;
