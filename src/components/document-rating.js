import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import StarRating from './star-rating.js';
import { useTranslation } from 'react-i18next';
import { useNumberFormat } from './locale-context.js';

function DocumentRating({ value, totalCount, compact }) {
  const { t } = useTranslation('documentRating');
  const formatNumber = useNumberFormat({ minDecimalPlaces: 1, maxDecimalPlaces: 1 });

  return (
    <div className={classNames('DocumentRating', { 'DocumentRating--compact': compact })}>
      {value !== null && (
        <div className={classNames('DocumentRating-value', { 'DocumentRating-value--compact': compact })}>
          {formatNumber(value)}
        </div>
      )}
      <div className="DocumentRating-stars">
        <StarRating value={value} compact={compact} allowHalf />
      </div>
      <div className="DocumentRating-totalCount">
        {t('totalCountText', { totalCount })}
      </div>
    </div>
  );
}

DocumentRating.propTypes = {
  value: PropTypes.number,
  totalCount: PropTypes.number,
  compact: PropTypes.bool
};

DocumentRating.defaultProps = {
  value: null,
  totalCount: 0,
  compact: false
};

export default DocumentRating;
