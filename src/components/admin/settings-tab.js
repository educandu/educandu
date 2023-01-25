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
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';
import MarkdownSettingInSupportedLanguages from './markdown-setting-in-supported-languages.js';

const logger = new Logger(import.meta.url);

function SettingsTab({ onDirtyStateChange }) {
  const { t } = useTranslation('settingsTab');
  const pluginRegistry = useService(PluginRegistry);
  const settingsApiClient = useSessionAwareApiClient(SettingsApiClient);

  const [settings, setSettings] = useState({});
  const [dirtyKeys, setDirtyKeys] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invalidKeys, setInvalidKeys] = useState([]);

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
    onDirtyStateChange(!!dirtyKeys.length || !!invalidKeys.length);
  }, [dirtyKeys, invalidKeys, onDirtyStateChange]);

  const handleChange = useCallback((key, value, isValid) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirtyKeys(prev => ensureIsIncluded(prev, key));
    setInvalidKeys(prev => isValid ? ensureIsExcluded(prev, key) : ensureIsIncluded(prev, key));
  }, [setSettings, setDirtyKeys, setInvalidKeys]);

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
      setIsSaving(true);
      const res = await settingsApiClient.saveSettings({ settings: changedSettings });
      setDirtyKeys([]);
      setInvalidKeys([]);
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
                      onChange={(value, { isValid }) => handlePluginHelpTextChange(pluginInfo.type, value, { isValid })}
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
          disabled={!!invalidKeys.length || !dirtyKeys.length}
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
