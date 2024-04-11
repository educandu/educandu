import React from 'react';
import { Rate } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { StarIcon } from './icons/icons.js';
import { useTranslation } from 'react-i18next';
import { useNumberFormat } from './locale-context.js';

function StarRating({ value, totalCount, compact }) {
  const { t } = useTranslation('starRating');
  const formatNumber = useNumberFormat({ minDecimalPlaces: 1, maxDecimalPlaces: 1 });

  const hasValue = value !== null;
  const intValue = hasValue ? Math.round(value) : 0;

  return (
    <div className={classNames('StarRating', { 'StarRating--compact': compact })}>
      {!!hasValue && (
        <div className={classNames('StarRating-value', { 'StarRating-value--compact': compact })}>
          {formatNumber(value)}
        </div>
      )}
      <div className={classNames('StarRating-stars', { 'StarRating-stars--compact': compact })}>
        <Rate
          disabled
          value={intValue}
          character={<StarIcon />}
          />
      </div>
      <div className={classNames('StarRating-totalCount', { 'StarRating-totalCount--compact': compact })}>
        {t('totalCountText', { totalCount })}
      </div>
    </div>
  );
}

StarRating.propTypes = {
  value: PropTypes.number,
  totalCount: PropTypes.number,
  compact: PropTypes.bool
};

StarRating.defaultProps = {
  value: null,
  totalCount: 0,
  compact: false
};

export default StarRating;
