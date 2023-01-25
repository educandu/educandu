import { Button, Spin } from 'antd';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useDateFormat } from '../locale-context.js';
import { BATCH_TYPE } from '../../domain/constants.js';
import { handleApiError } from '../../ui/error-helper.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import BatchApiClient from '../../api-clients/batch-api-client.js';

const logger = new Logger(import.meta.url);

function TechnicalMaintenanceTab() {
  const { formatDate } = useDateFormat();
  const [isLoading, setIsLoading] = useState(false);
  const [latestBatches, setLatestBatches] = useState({});
  const { t } = useTranslation('technicalMaintenanceTab');
  const batchApiClient = useSessionAwareApiClient(BatchApiClient);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await batchApiClient.getLatestBatches();
        setLatestBatches(res.batches);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [batchApiClient, t]);

  const handleStartBatchClick = async batchType => {
    try {
      const batch = await batchApiClient.postBatchRequest(batchType);
      window.location = routes.getBatchUrl(batch._id);
    } catch (error) {
      handleApiError({ t, logger, error });
    }
  };

  return (
    <div className="TechnicalMaintenanceTab">
      <div className="TechnicalMaintenanceTab-tabInfo">{t('tabInfo')}</div>
      <Spin size="large" spinning={isLoading} delay={500}>
        {Object.values(BATCH_TYPE).map(batchType => (
          <section key={batchType} className="TechnicalMaintenanceTab-section">
            <div className="TechnicalMaintenanceTab-sectionHeader">{t(`batchSectionHeader_${batchType}`)}</div>
            <div className="TechnicalMaintenanceTab-sectionDescription">{t(`batchSectionDescription_${batchType}`)}</div>
            <div className="TechnicalMaintenanceTab-button">
              <Button onClick={() => handleStartBatchClick(batchType)} danger>
                {t('start')}
              </Button>
              {!!latestBatches[batchType] && (
                <div className="TechnicalMaintenanceTab-buttonSubtext">
                  {t('lastExecution')}:&nbsp;
                  <a href={routes.getBatchUrl(latestBatches[batchType]._id)}>{formatDate(latestBatches[batchType].createdOn)}</a>
                </div>
              )}
            </div>
          </section>
        ))}
      </Spin>
    </div>
  );
}

export default TechnicalMaintenanceTab;
