import React from 'react';
import { Input } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { usePercentageFormat } from '../locale-context.js';
import { formatMediaPosition } from '../../utils/media-utils.js';

function MediaRangeReadonlyInput({ playbackRange, sourceDuration }) {
  const { t } = useTranslation('mediaRangeReadonlyInput');
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });

  const from = playbackRange[0] !== 0
    ? formatMediaPosition({ formatPercentage, position: playbackRange[0], duration: sourceDuration })
    : 'start';

  const to = playbackRange[1] !== 1
    ? formatMediaPosition({ formatPercentage, position: playbackRange[1], duration: sourceDuration })
    : 'end';

  return <Input value={t('info', { from, to })} readOnly />;
}

MediaRangeReadonlyInput.propTypes = {
  playbackRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  sourceDuration: PropTypes.number.isRequired
};

export default MediaRangeReadonlyInput;
