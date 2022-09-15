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
    <span className="TechnicalMaintenanceTab-buttonSubtext">
      {t('lastExecution')}: <a href={routes.getBatchUrl(batch._id)}>{formatDate(batch.createdOn)}</a>
    </span>
  );

  return (
    <div className="TechnicalMaintenanceTab">
      <div className="TechnicalMaintenanceTab-tabInfo">{t('tabInfo')}</div>
      <section className="TechnicalMaintenanceTab-section">
        <div className="TechnicalMaintenanceTab-sectionHeader">{t('documentsValidationHeader')}</div>
        <div className="TechnicalMaintenanceTab-sectionDescription">{t('documentsValidationDescription')}</div>
        <div className="TechnicalMaintenanceTab-button">
          <Button onClick={handleStartDocumentValidationClick} danger>
            {t('start')}
          </Button>
          {renderLastBatchExecution(lastDocumentValidationBatch)}
        </div>
      </section>
      <section className="TechnicalMaintenanceTab-section">
        <div className="TechnicalMaintenanceTab-sectionHeader">{t('documentsRegenerationHeader')}</div>
        <div className="TechnicalMaintenanceTab-sectionDescription">{t('documentsRegenerationDescription')}</div>
        <div className="TechnicalMaintenanceTab-button">
          <Button onClick={handleStartDocumentRegenerationClick} danger>
            {t('start')}
          </Button>
          {renderLastBatchExecution(lastDocumentRegenerationBatch)}
        </div>
      </section>
      <section className="TechnicalMaintenanceTab-section">
        <div className="TechnicalMaintenanceTab-sectionHeader">{t('cdnResourcesConsolidationHeader')}</div>
        <div className="TechnicalMaintenanceTab-sectionDescription">{t('cdnResourcesConsolidationDescription')}</div>
        <div className="TechnicalMaintenanceTab-button">
          <Button onClick={handleStartCdnResourcesConsolidationClick} danger>
            {t('start')}
          </Button>
          {renderLastBatchExecution(lastCdnResourcesConsolidationBatch)}
        </div>
      </section>
      <section className="TechnicalMaintenanceTab-section">
        <div className="TechnicalMaintenanceTab-sectionHeader">{t('cdnDirectoriesCreationHeader')}</div>
        <div className="TechnicalMaintenanceTab-sectionDescription">{t('cdnDirectoriesCreationDescription')}</div>
        <div className="TechnicalMaintenanceTab-button">
          <Button onClick={handleStartCdnUploadDirectoryCreationClick} danger>
            {t('start')}
          </Button>
          {renderLastBatchExecution(lastCdnUploadDirectoryCreationBatch)}
        </div>
      </section >
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
