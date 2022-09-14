import React from 'react';
import { Button } from 'antd';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../locale-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import { batchShape } from '../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import AdminApiClient from '../../api-clients/admin-api-client.js';

const logger = new Logger(import.meta.url);

function TechnicalMaintenanceTab({
  lastDocumentRegenerationBatch,
  lastDocumentValidationBatch,
  lastCdnResourcesConsolidationBatch,
  lastCdnUploadDirectoryCreationBatch
}) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('technicalMaintenanceTab');
  const adminApiClient = useSessionAwareApiClient(AdminApiClient);

  const handleStartDocumentRegenerationClick = async () => {
    try {
      const batch = await adminApiClient.postDocumentRegenerationRequest();
      window.location = routes.getBatchUrl(batch._id);
    } catch (error) {
      handleApiError({ t, logger, error });
    }
  };

  const handleStartDocumentValidationClick = async () => {
    try {
      const batch = await adminApiClient.postDocumentValidationRequest();
      window.location = routes.getBatchUrl(batch._id);
    } catch (error) {
      handleApiError({ t, logger, error });
    }
  };

  const handleStartCdnResourcesConsolidationClick = async () => {
    try {
      const batch = await adminApiClient.postCdnResourcesConsolidationRequest();
      window.location = routes.getBatchUrl(batch._id);
    } catch (error) {
      handleApiError({ t, logger, error });
    }
  };

  const handleStartCdnUploadDirectoryCreationClick = async () => {
    try {
      const batch = await adminApiClient.postCdnUploadDirectoryCreationRequest();
      window.location = routes.getBatchUrl(batch._id);
    } catch (error) {
      handleApiError({ t, logger, error });
    }
  };

  const renderLastBatchExecution = batch => batch && (
    <span>{t('lastExecution')}: <a href={routes.getBatchUrl(batch._id)}>{formatDate(batch.createdOn)}</a></span>
  );

  return (
    <div className="TechnicalMaintenanceTab">
      <div className="TechnicalMaintenanceTab-row">
        <Button onClick={handleStartDocumentValidationClick} danger>
          {t('documentValidationButton')}
        </Button>
        {renderLastBatchExecution(lastDocumentValidationBatch)}
      </div>
      <div className="TechnicalMaintenanceTab-row">
        <Button onClick={handleStartDocumentRegenerationClick} danger>
          {t('documentRegenerationButton')}
        </Button>
        {renderLastBatchExecution(lastDocumentRegenerationBatch)}
      </div>
      <div className="TechnicalMaintenanceTab-row">
        <Button onClick={handleStartCdnResourcesConsolidationClick} danger>
          {t('cdnResourcesConsolidationButton')}
        </Button>
        {renderLastBatchExecution(lastCdnResourcesConsolidationBatch)}
      </div>
      <div className="TechnicalMaintenanceTab-row">
        <Button onClick={handleStartCdnUploadDirectoryCreationClick} danger>
          {t('cdnUploadDirectoryCreationButton')}
        </Button>
        {renderLastBatchExecution(lastCdnUploadDirectoryCreationBatch)}
      </div>
    </div>
  );
}

TechnicalMaintenanceTab.propTypes = {
  lastCdnResourcesConsolidationBatch: batchShape,
  lastCdnUploadDirectoryCreationBatch: batchShape,
  lastDocumentRegenerationBatch: batchShape,
  lastDocumentValidationBatch: batchShape
};

TechnicalMaintenanceTab.defaultProps = {
  lastCdnResourcesConsolidationBatch: null,
  lastCdnUploadDirectoryCreationBatch: null,
  lastDocumentRegenerationBatch: null,
  lastDocumentValidationBatch: null
};

export default TechnicalMaintenanceTab;
