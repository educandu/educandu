import React from 'react';
import { Rate } from 'antd';
import PropTypes from 'prop-types';
import { StarIcon } from './icons/icons.js';
import { useTranslation } from 'react-i18next';
import { useNumberFormat } from './locale-context.js';

function StarRating({ value, totalCount }) {
  const { t } = useTranslation('starRating');
  const formatNumber = useNumberFormat({ minDecimalPlaces: 1, maxDecimalPlaces: 1 });

  const hasValue = value !== null;
  const intValue = hasValue ? Math.round(value) : 0;

  return (
    <div className="StarRating">
      {!!hasValue && (
        <div className="StarRating-value">
          {formatNumber(value)}
        </div>
      )}
      <div className="StarRating-rating">
        <Rate
          disabled
          value={intValue}
          character={<StarIcon />}
          />
      </div>
      <div className="StarRating-totalCount">
        {t('totalCountText', { totalCount })}
      </div>
    </div>
  );
}

StarRating.propTypes = {
  value: PropTypes.number,
  totalCount: PropTypes.number
};

StarRating.defaultProps = {
  value: null,
  totalCount: 0
};

export default StarRating;
