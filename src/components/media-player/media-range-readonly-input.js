import { Input } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import { usePercentageFormat } from '../locale-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { formatMediaPosition, getMediaInformation } from '../../utils/media-utils.js';

function MediaRangeReadonlyInput({ playbackRange, sourceDuration, sourceUrl }) {
  const clientConfig = useService(ClientConfig);
  const [actualDuration, setActualDuration] = useState(0);

  useEffect(() => {
    (async () => {
      if (sourceDuration) {
        setActualDuration(sourceDuration);
      } else if (sourceUrl) {
        const mediaInfo = await getMediaInformation({ url: sourceUrl, playbackRange, cdnRootUrl: clientConfig.cdnRootUrl });
        setActualDuration(mediaInfo.duration);
      } else {
        setActualDuration(0);
      }
    })();
  }, [clientConfig, playbackRange, sourceDuration, sourceUrl]);

  const { t } = useTranslation('mediaRangeReadonlyInput');
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });

  const from = playbackRange[0] !== 0
    ? formatMediaPosition({ formatPercentage, position: playbackRange[0], duration: actualDuration })
    : 'start';

  const to = playbackRange[1] !== 1
    ? formatMediaPosition({ formatPercentage, position: playbackRange[1], duration: actualDuration })
    : 'end';

  return <Input value={t('info', { from, to })} readOnly />;
}

MediaRangeReadonlyInput.propTypes = {
  playbackRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  sourceDuration: PropTypes.number,
  sourceUrl: PropTypes.string
};

MediaRangeReadonlyInput.defaultProps = {
  sourceDuration: null,
  sourceUrl: null
};

export default MediaRangeReadonlyInput;
