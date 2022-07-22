import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { Button, Collapse, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import cloneDeep from '../../utils/clone-deep.js';
import LicenseSettings from './license-settings.js';
import { useService } from '../container-context.js';
import { useDateFormat } from '../locale-context.js';
import React, { useState, useCallback } from 'react';
import DocumentSelector from '../document-selector.js';
import { handleApiError } from '../../ui/error-helper.js';
import SpecialPageSettings from './special-page-settings.js';
import FooterLinksSettings from './footer-links-settings.js';
import PluginRegistry from '../../plugins/plugin-registry.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import AdminApiClient from '../../api-clients/admin-api-client.js';
import { kebabCaseToCamelCase } from '../../utils/string-utils.js';
import SettingsApiClient from '../../api-clients/settings-api-client.js';
import { batchShape, settingsShape } from '../../ui/default-prop-types.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';
import MarkdownSettingInSupportedLanguages from './markdown-setting-in-supported-languages.js';

const logger = new Logger(import.meta.url);

function SettingsTab({
  initialSettings,
  lastDocumentRegenerationBatch,
  lastCdnResourcesConsolidationBatch,
  lastCdnUploadDirectoryCreationBatch,
  onDirtyStateChange,
  onSettingsSaved
}) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('settingsTab');
  const pluginRegistry = useService(PluginRegistry);
  const adminApiClient = useSessionAwareApiClient(AdminApiClient);
  const settingsApiClient = useSessionAwareApiClient(SettingsApiClient);

  const [dirtyKeys, setDirtyKeys] = useState([]);
  const [invalidKeys, setInvalidKeys] = useState([]);
  const [settings, setSettings] = useState(cloneDeep(initialSettings));
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

  const handleTemplateDocumentChange = useCallback(documentId => {
    handleChange('templateDocument', { documentId }, true);
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

  const handlePluginHelpTextChange = useCallback((pluginType, value, { isValid }) => {
    const newPluginsHelpTexts = { ...cloneDeep(settings.pluginsHelpTexts), [pluginType]: value };
    handleChange('pluginsHelpTexts', newPluginsHelpTexts, isValid);
  }, [settings, handleChange]);

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
    <div className="SettingsTab">
      <Collapse className="SettingsTab-collapse">
        <Collapse.Panel header={t('homepageInfoHeader')} key="panel">
          <MarkdownInput
            preview
            renderMedia
            value={settings.homepageInfo || ''}
            onChange={handleHomepageInfoChange}
            />
        </Collapse.Panel>
      </Collapse>

      <Collapse className="SettingsTab-collapse">
        <Collapse.Panel header={t('consentHeader')} key="consent">
          <MarkdownSettingInSupportedLanguages
            required
            settingValue={settings.consentText}
            onChange={handleConsentTextChange}
            />
        </Collapse.Panel>
      </Collapse>

      <Collapse className="SettingsTab-collapse">
        <Collapse.Panel header={t('templateDocumentHeader')} key="templateDocument">
          <div className="SettingsTab-templateDocument" >
            <DocumentSelector documentId={settings.templateDocument?.documentId} onChange={handleTemplateDocumentChange} />
          </div>
        </Collapse.Panel>
      </Collapse>

      <Collapse className="SettingsTab-collapse">
        <Collapse.Panel header={t('helpPageHeader')} key="helpPage">
          <SpecialPageSettings
            settings={settings.helpPage}
            onChange={handleHelpPageChange}
            />
        </Collapse.Panel>
      </Collapse>

      <Collapse className="SettingsTab-collapse">
        <Collapse.Panel header={t('termsPageHeader')} key="termsPage">
          <SpecialPageSettings
            settings={settings.termsPage}
            onChange={handleTermsPageChange}
            />
        </Collapse.Panel>
      </Collapse>

      <Collapse className="SettingsTab-collapse">
        <Collapse.Panel header={t('footerLinksHeader')} key="footerLinks">
          <FooterLinksSettings
            footerLinks={settings.footerLinks}
            onChange={handleFooterLinksChange}
            />
        </Collapse.Panel>
      </Collapse>

      <Collapse className="SettingsTab-collapse">
        <Collapse.Panel header={t('pluginsHelpTextsHeader')} key="plugisHelpTexts">
          <Tabs type="line" size="small">
            {pluginRegistry.getAllInfos().map(pluginInfo => (
              <Tabs.TabPane
                key={pluginInfo.type}
                className="SettingsTab-collapsTabPane"
                tab={t(`${kebabCaseToCamelCase(pluginInfo.type)}:name`)}
                >
                <MarkdownSettingInSupportedLanguages
                  required
                  settingValue={settings.pluginsHelpTexts?.[pluginInfo.type]}
                  onChange={(value, { isValid }) => handlePluginHelpTextChange(pluginInfo.type, value, { isValid })}
                  />
              </Tabs.TabPane>
            ))}
          </Tabs>
        </Collapse.Panel>
      </Collapse>

      <Collapse className="SettingsTab-collapse">
        <Collapse.Panel header={t('licenseHeader')} key="license">
          <LicenseSettings
            license={settings.license}
            onChange={handleLicenseChange}
            />
        </Collapse.Panel>
      </Collapse>

      <Collapse className="SettingsTab-collapse SettingsTab-collapse--danger">
        <Collapse.Panel header={t('dataMigrationHeader')} key="dataMigration">
          <div className="SettingsTab-collapseRow">
            <Button onClick={handleStartDocumentRegenerationClick} danger>
              {t('documentRegenerationButton')}
            </Button>
            {renderLastBatchExecution(lastDocumentRegenerationBatch)}
          </div>
          <div className="SettingsTab-collapseRow">
            <Button onClick={handleStartCdnResourcesConsolidationClick} danger>
              {t('cdnResourcesConsolidationButton')}
            </Button>
            {renderLastBatchExecution(lastCdnResourcesConsolidationBatch)}
          </div>
          <div className="SettingsTab-collapseRow">
            <Button onClick={handleStartCdnUploadDirectoryCreationClick} danger>
              {t('cdnUploadDirectoryCreationButton')}
            </Button>
            {renderLastBatchExecution(lastCdnUploadDirectoryCreationBatch)}
          </div>
        </Collapse.Panel>
      </Collapse>

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
  lastCdnUploadDirectoryCreationBatch: batchShape,
  lastDocumentRegenerationBatch: batchShape,
  onDirtyStateChange: PropTypes.func.isRequired,
  onSettingsSaved: PropTypes.func.isRequired
};

SettingsTab.defaultProps = {
  lastCdnResourcesConsolidationBatch: null,
  lastCdnUploadDirectoryCreationBatch: null,
  lastDocumentRegenerationBatch: null
};

export default SettingsTab;
