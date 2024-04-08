import React from 'react';
import { Rate } from 'antd';
import PropTypes from 'prop-types';
import { StarIcon } from './icons/icons.js';
import { useTranslation } from 'react-i18next';
import { useNumberFormat } from './locale-context.js';

function StarRating({ value, totalCount, readOnly, onChange }) {
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
          value={intValue}
          character={<StarIcon />}
          disabled={readOnly}
          onChange={onChange}
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
  totalCount: PropTypes.number,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func
};

StarRating.defaultProps = {
  value: null,
  totalCount: 0,
  readOnly: false,
  onChange: () => {}
};

export default StarRating;
