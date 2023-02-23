import { useTranslation } from 'react-i18next';
import Logger from '../../../src/common/logger.js';
import React, { useEffect, useState } from 'react';
import Markdown from '../../../src/components/markdown.js';
import HttpClient from '../../../src/api-clients/http-client.js';
import { handleApiError } from '../../../src/ui/error-helper.js';
import { useService } from '../../../src/components/container-context.js';
import { useDateFormat } from '../../../src/components/locale-context.js';
import { sectionDisplayProps } from '../../../src/ui/default-prop-types.js';

const POLL_INTERVAL_IN_MS = 5000;

const logger = new Logger(import.meta.url);

export default function ServerTimeDisplay({ content }) {
  const { formatDate } = useDateFormat();
  const httpClient = useService(HttpClient);
  const [serverTime, setServerTime] = useState(null);
  const { t } = useTranslation('customPlugin/serverTime');

  useEffect(() => {
    let nextTimeout = null;

    const getUpdate = async () => {
      try {
        const response = await httpClient.get(
          '/api/v1/plugin/custom-plugin/server-time/time',
          { responseType: 'json' }
        );

        setServerTime(response.data.time);
        nextTimeout = setTimeout(getUpdate, POLL_INTERVAL_IN_MS);
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    };

    nextTimeout = setTimeout(getUpdate, 0);

    return () => {
      if (nextTimeout) {
        clearTimeout(nextTimeout);
      }
    };
  }, [httpClient, t]);

  return (
    <div className="CustomPluginServerTimeDisplay">
      <Markdown renderAnchors>
        {content.text}
      </Markdown>
      {!!serverTime && (
        <div className="CustomPluginServerTimeDisplay-time">
          {t('currentServerTime')}: {formatDate(serverTime)}
        </div>
      )}
    </div>
  );
}

ServerTimeDisplay.propTypes = {
  ...sectionDisplayProps
};
