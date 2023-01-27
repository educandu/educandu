import PropTypes from 'prop-types';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import cloneDeep from '../../utils/clone-deep.js';
import LicenseSettings from './license-settings.js';
import { Button, Collapse, Spin, Tabs } from 'antd';
import { useService } from '../container-context.js';
import DocumentSelector from '../document-selector.js';
import { handleApiError } from '../../ui/error-helper.js';
import SpecialPageSettings from './special-page-settings.js';
import FooterLinksSettings from './footer-links-settings.js';
import PluginRegistry from '../../plugins/plugin-registry.js';
import React, { useState, useCallback, useEffect } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { kebabCaseToCamelCase } from '../../utils/string-utils.js';
import SettingsApiClient from '../../api-clients/settings-api-client.js';
import MarkdownSettingInSupportedLanguages from './markdown-setting-in-supported-languages.js';

const logger = new Logger(import.meta.url);

function SettingsTab({ onDirtyStateChange }) {
  const { t } = useTranslation('settingsTab');
  const pluginRegistry = useService(PluginRegistry);
  const settingsApiClient = useSessionAwareApiClient(SettingsApiClient);

  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await settingsApiClient.getSettings();
        setSettings(res.settings);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [settingsApiClient, t]);

  useEffect(() => {
    onDirtyStateChange(isDirty);
  }, [isDirty, onDirtyStateChange]);

  const handleChange = useCallback((key, value) => {
    setIsDirty(true);
    setSettings(prev => ({ ...prev, [key]: value }));
  }, [setSettings, setIsDirty]);

  const handleHomepageInfoChange = useCallback(event => {
    handleChange('homepageInfo', event.target.value);
  }, [handleChange]);

  const handleConsentTextChange = useCallback(value => {
    handleChange('consentText', value);
  }, [handleChange]);

  const handleTemplateDocumentChange = useCallback(documentId => {
    handleChange('templateDocument', { documentId });
  }, [handleChange]);

  const handleHelpPageChange = useCallback(value => {
    handleChange('helpPage', value);
  }, [handleChange]);

  const handleTermsPageChange = useCallback(value => {
    handleChange('termsPage', value);
  }, [handleChange]);

  const handleFooterLinksChange = useCallback(value => {
    handleChange('footerLinks', value);
  }, [handleChange]);

  const handlePluginHelpTextChange = useCallback((pluginType, value) => {
    const newPluginsHelpTexts = { ...cloneDeep(settings.pluginsHelpTexts), [pluginType]: value };
    handleChange('pluginsHelpTexts', newPluginsHelpTexts);
  }, [settings, handleChange]);

  const handleLicenseChange = useCallback(value => {
    handleChange('license', value);
  }, [handleChange]);

  const handleSaveButtonClick = async () => {
    try {
      setIsSaving(true);
      const res = await settingsApiClient.saveSettings({ settings });
      setIsDirty(false);
      setSettings(res.settings);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="SettingsTab">
      <Spin size="large" spinning={isLoading} delay={500}>
        <Collapse className="SettingsTab-collapse">
          <Collapse.Panel header={t('homepageInfoHeader')} key="panel">
            <MarkdownInput
              preview
              value={settings.homepageInfo || ''}
              onChange={handleHomepageInfoChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="SettingsTab-collapse">
          <Collapse.Panel header={t('consentHeader')} key="consent">
            <MarkdownSettingInSupportedLanguages
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
            <Tabs
              type="line"
              size="small"
              items={pluginRegistry.getAllInfos().map(pluginInfo => ({
                key: pluginInfo.type,
                label: t(`${kebabCaseToCamelCase(pluginInfo.type)}:name`),
                children: (
                  <div className="SettingsTab-collapseTabPane">
                    <MarkdownSettingInSupportedLanguages
                      settingValue={settings.pluginsHelpTexts?.[pluginInfo.type]}
                      onChange={value => handlePluginHelpTextChange(pluginInfo.type, value)}
                      />
                  </div>
                )
              }))}
              />
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
        <Button
          type="primary"
          loading={isSaving}
          onClick={handleSaveButtonClick}
          className="SettingsTab-saveButton"
          disabled={isLoading}
          >
          {t('common:save')}
        </Button>
      </Spin>
    </div>
  );
}

SettingsTab.propTypes = {
  onDirtyStateChange: PropTypes.func.isRequired
};

export default SettingsTab;
