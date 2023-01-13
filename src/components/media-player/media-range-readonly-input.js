import { Input } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import { usePercentageFormat } from '../locale-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getSourceDuration } from '../../utils/source-utils.js';
import { formatMediaPosition } from '../../utils/media-utils.js';

function MediaRangeReadonlyInput({ sourceUrl, playbackRange }) {
  const clientConfig = useService(ClientConfig);
  const [sourceDuration, setSourceDuration] = useState(0);

  useEffect(() => {
    (async () => {
      if (sourceUrl) {
        const determinedDuration = await getSourceDuration({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
        setSourceDuration(determinedDuration);
      }
    })();
  }, [clientConfig, sourceDuration, sourceUrl]);

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
  sourceUrl: PropTypes.string,
  playbackRange: PropTypes.arrayOf(PropTypes.number).isRequired
};

MediaRangeReadonlyInput.defaultProps = {
  sourceUrl: null
};

export default MediaRangeReadonlyInput;
