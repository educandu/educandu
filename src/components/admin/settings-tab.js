import PropTypes from 'prop-types';
import { Button, Card } from 'antd';
import urls from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import cloneDeep from '../../utils/clone-deep.js';
import LicenseSettings from './license-settings.js';
import ConsentSettings from './consent-settings.js';
import { useDateFormat } from '../locale-context.js';
import React, { useState, useCallback } from 'react';
import DocumentSelector from '../document-selector.js';
import { handleApiError } from '../../ui/error-helper.js';
import DefaultTagsSettings from './default-tags-settings.js';
import SpecialPageSettings from './special-page-settings.js';
import FooterLinksSettings from './footer-links-settings.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import AdminApiClient from '../../api-clients/admin-api-client.js';
import SettingsApiClient from '../../api-clients/settings-api-client.js';
import { batchShape, settingsShape } from '../../ui/default-prop-types.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const logger = new Logger(import.meta.url);

function SettingsTab({
  initialSettings,
  lastDocumentRegenerationBatch,
  lastCdnResourcesConsolidationBatch,
  onDirtyStateChange,
  onSettingsSaved
}) {
  const { t } = useTranslation('settingsTab');
  const { formatDate } = useDateFormat();
  const settingsApiClient = useSessionAwareApiClient(SettingsApiClient);
  const adminApiClient = useSessionAwareApiClient(AdminApiClient);
  const [settings, setSettings] = useState(cloneDeep(initialSettings));
  const [dirtyKeys, setDirtyKeys] = useState([]);
  const [invalidKeys, setInvalidKeys] = useState([]);
  const [lastSavedSettings, setLastSavedSettings] = useState(settings);

  const handleChange = useCallback((key, value, isValid) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirtyKeys(prev => ensureIsIncluded(prev, key));
    setInvalidKeys(prev => isValid ? ensureIsExcluded(prev, key) : ensureIsIncluded(prev, key));
    onDirtyStateChange(true);
  }, [setSettings, setDirtyKeys, setInvalidKeys, onDirtyStateChange]);

  const handleHomepageInfoChange = useCallback(event => {
    handleChange('homepageInfo', event.target.value, true);
  }, [handleChange]);

  const handleConsentTextChange = useCallback((value, { isValid }) => {
    handleChange('consentText', value, isValid);
  }, [handleChange]);

  const handleTemplateDocumentChange = useCallback(documentKey => {
    handleChange('templateDocument', { documentKey }, true);
  }, [handleChange]);

  const handleHelpPageChange = useCallback((value, { isValid }) => {
    handleChange('helpPage', value, isValid);
  }, [handleChange]);

  const handleTermsPageChange = useCallback((value, { isValid }) => {
    handleChange('termsPage', value, isValid);
  }, [handleChange]);

  const handleFooterLinksChange = useCallback((value, { isValid }) => {
    handleChange('footerLinks', value, isValid);
  }, [handleChange]);

  const handleDefaultTagsChange = useCallback((value, { isValid }) => {
    handleChange('defaultTags', value, isValid);
  }, [handleChange]);

  const handleLicenseChange = useCallback((value, { isValid }) => {
    handleChange('license', value, isValid);
  }, [handleChange]);

  const handleSaveButtonClick = async () => {
    const changedSettings = dirtyKeys.reduce((map, key) => ({ ...map, [key]: settings[key] }), {});
    try {
      await settingsApiClient.saveSettings({ settings: changedSettings });
      const updatedSettings = { ...lastSavedSettings, ...changedSettings };
      setLastSavedSettings(updatedSettings);
      setDirtyKeys([]);
      onSettingsSaved(updatedSettings);
      onDirtyStateChange(false);
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleStartDocumentRegenerationClick = async () => {
    try {
      const batch = await adminApiClient.postDocumentRegenerationRequest();
      window.location = urls.getBatchUrl(batch._id);
    } catch (error) {
      handleApiError({ t, logger, error });
    }
  };

  const handleStartCdnResourcesConsolidationClick = async () => {
    try {
      const batch = await adminApiClient.postCdnResourcesConsolidationRequest();
      window.location = urls.getBatchUrl(batch._id);
    } catch (error) {
      handleApiError({ t, logger, error });
    }
  };

  const renderLastBatchExecution = batch => batch && (
    <span>{t('lastExecution')}: <a href={urls.getBatchUrl(batch._id)}>{formatDate(batch.createdOn)}</a></span>
  );

  return (
    <div className="SettingsTab">
      <Card className="SettingsTab-card" title={t('homepageInfoHeader')}>
        <MarkdownInput
          preview
          renderMedia
          value={settings.homepageInfo || ''}
          onChange={handleHomepageInfoChange}
          />
      </Card>
      <Card className="SettingsTab-card" title={t('consentHeader')}>
        <ConsentSettings
          consentText={settings.consentText}
          onChange={handleConsentTextChange}
          />
      </Card>
      <Card className="SettingsTab-card" title={t('templateDocumentHeader')}>
        <div className="SettingsTab-templateDocument" >
          <DocumentSelector documentId={settings.templateDocument.documentKey} onChange={handleTemplateDocumentChange} />
        </div>
      </Card>
      <Card className="SettingsTab-card" title={t('helpPageHeader')}>
        <SpecialPageSettings
          settings={settings.helpPage}
          onChange={handleHelpPageChange}
          />
      </Card>
      <Card className="SettingsTab-card" title={t('termsPageHeader')}>
        <SpecialPageSettings
          settings={settings.termsPage}
          onChange={handleTermsPageChange}
          />
      </Card>
      <Card className="SettingsTab-card" title={t('footerLinksHeader')}>
        <FooterLinksSettings
          footerLinks={settings.footerLinks}
          onChange={handleFooterLinksChange}
          />
      </Card>
      <Card className="SettingsTab-card" title={t('defaultTagsHeader')}>
        <DefaultTagsSettings
          defaultTags={settings.defaultTags || []}
          onChange={handleDefaultTagsChange}
          />
      </Card>
      <Card className="SettingsTab-card" title={t('licenseHeader')}>
        <LicenseSettings
          license={settings.license}
          onChange={handleLicenseChange}
          />
      </Card>
      <Card
        className="SettingsTab-card SettingsTab-card--danger"
        title={t('documentRegenerationHeader')}
        extra={renderLastBatchExecution(lastDocumentRegenerationBatch)}
        >
        <Button
          onClick={handleStartDocumentRegenerationClick}
          danger
          >
          {t('documentRegenerationButton')}
        </Button>
      </Card>
      <Card
        className="SettingsTab-card SettingsTab-card--danger"
        title={t('cdnResourcesConsolidationHeader')}
        extra={renderLastBatchExecution(lastCdnResourcesConsolidationBatch)}
        >
        <Button
          onClick={handleStartCdnResourcesConsolidationClick}
          danger
          >
          {t('cdnResourcesConsolidationButton')}
        </Button>
      </Card>
      <Button
        type="primary"
        onClick={handleSaveButtonClick}
        className="SettingsTab-saveButton"
        disabled={!!invalidKeys.length || !dirtyKeys.length}
        >
        {t('common:save')}
      </Button>
    </div>
  );
}

SettingsTab.propTypes = {
  initialSettings: settingsShape.isRequired,
  lastCdnResourcesConsolidationBatch: batchShape,
  lastDocumentRegenerationBatch: batchShape,
  onDirtyStateChange: PropTypes.func.isRequired,
  onSettingsSaved: PropTypes.func.isRequired
};

SettingsTab.defaultProps = {
  lastCdnResourcesConsolidationBatch: null,
  lastDocumentRegenerationBatch: null
};

export default SettingsTab;
