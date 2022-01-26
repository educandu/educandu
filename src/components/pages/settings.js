import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import Logger from '../../common/logger.js';
import { Alert, Input, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useBeforeunload } from 'react-beforeunload';
import React, { useState, useCallback } from 'react';
import permissions from '../../domain/permissions.js';
import MarkdownTextarea from '../markdown-textarea.js';
import DocumentSelector from '../document-selector.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import LicenseSettings from '../settings/license-settings.js';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import errorHelper, { handleApiError } from '../../ui/error-helper.js';
import SettingApiClient from '../../api-clients/setting-api-client.js';
import DefaultTagsSettings from '../settings/default-tags-settings.js';
import SpecialPageSettings from '../settings/special-page-settings.js';
import FooterLinksSettings from '../settings/footer-links-settings.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';
import { documentMetadataShape, settingsShape } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

function Settings({ initialState, PageTemplate }) {
  const { t } = useTranslation('settings');
  const settingApiClient = useSessionAwareApiClient(SettingApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);
  const [settings, setSettings] = useState(initialState.settings);
  const [dirtyKeys, setDirtyKeys] = useState([]);
  const [invalidKeys, setInvalidKeys] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState(initialState.settings);

  const handleChange = useCallback((key, value, isValid) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirtyKeys(prev => ensureIsIncluded(prev, key));
    setInvalidKeys(prev => isValid ? ensureIsExcluded(prev, key) : ensureIsIncluded(prev, key));
  }, [setSettings, setDirtyKeys, setInvalidKeys]);

  const handleAnnouncementChange = useCallback(event => {
    handleChange('announcement', event.target.value, true);
  }, [handleChange]);

  const handleHomepageInfoChange = useCallback(event => {
    handleChange('homepageInfo', event.target.value, true);
  }, [handleChange]);

  const handleTemplateDocumentChange = useCallback(value => {
    const urlPathSegments = value.split('/');
    const documentKey = urlPathSegments[0] || '';
    const documentSlug = urlPathSegments.slice(1).join('/') || '';
    handleChange('templateDocument', { documentKey, documentSlug }, true);
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

  const handleSaveClick = async () => {
    const changedSettings = dirtyKeys.reduce((map, key) => ({ ...map, [key]: settings[key] }), {});
    try {
      setIsUpdating(true);
      await settingApiClient.saveSettings({ settings: changedSettings });
      setLastSavedSettings({ ...initialState.settings, ...changedSettings });
      setDirtyKeys([]);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelClick = () => {
    setSettings(lastSavedSettings);
    setDirtyKeys([]);
    setInvalidKeys([]);
  };

  const handleCreateDocumentRegenerationBatchClick = async () => {
    try {
      await documentApiClient.postDocumentRegenerationBatch();
    } catch (error) {
      handleApiError({ t, logger, error });
    }
  };

  const headerActions = [];
  if (dirtyKeys.length) {
    if (!invalidKeys.length) {
      headerActions.push({
        key: 'save',
        type: 'primary',
        icon: SaveOutlined,
        text: t('common:save'),
        loading: isUpdating,
        permission: permissions.EDIT_SETTINGS,
        handleClick: handleSaveClick
      });
    }

    headerActions.push({
      key: 'close',
      icon: CloseOutlined,
      text: t('common:cancel'),
      disabled: isUpdating,
      handleClick: handleCancelClick
    });
  }

  const alerts = useGlobalAlerts();

  useBeforeunload(event => {
    if (dirtyKeys.length) {
      event.preventDefault();
    }
  });

  const templateDocumentURL = settings.templateDocument
    ? `${settings.templateDocument.documentKey}/${settings.templateDocument.documentSlug}`
    : '';

  return (
    <PageTemplate alerts={alerts} headerActions={headerActions}>
      <div className="SettingsPage">
        <h1>{t('pageNames:settings')}</h1>

        <h2 className="SettingsPage-sectionHeader">{t('announcementHeader')}</h2>
        <section className="SettingsPage-section SettingsPage-section--announcement">
          <Input value={settings.announcement} onChange={handleAnnouncementChange} />
          <span className="SettingsPage-announcementPreview">{t('announcementPreview')}</span>
          <Alert type="warning" message={<Markdown inline>{settings.announcement}</Markdown>} banner />
        </section>

        <h2 className="SettingsPage-sectionHeader">{t('homepageInfoHeader')}</h2>
        <MarkdownTextarea value={settings.homepageInfo || ''} onChange={handleHomepageInfoChange} />

        <h2 className="SettingsPage-sectionHeader">{t('templateDocumentHeader')}</h2>
        <DocumentSelector
          by="url"
          documents={initialState.documents}
          value={templateDocumentURL}
          onChange={handleTemplateDocumentChange}
          />

        <h2 className="SettingsPage-sectionHeader">{t('helpPageHeader')}</h2>
        <SpecialPageSettings
          settings={settings.helpPage}
          documents={initialState.documents}
          onChange={handleHelpPageChange}
          />

        <h2 className="SettingsPage-sectionHeader">{t('termsPageHeader')}</h2>
        <SpecialPageSettings
          settings={settings.termsPage}
          documents={initialState.documents}
          onChange={handleTermsPageChange}
          />

        <h2 className="SettingsPage-sectionHeader">{t('footerLinksHeader')}</h2>
        <FooterLinksSettings
          footerLinks={settings.footerLinks}
          documents={initialState.documents}
          onChange={handleFooterLinksChange}
          />

        <h2 className="SettingsPage-sectionHeader">{t('defaultTagsHeader')}</h2>
        <DefaultTagsSettings
          defaultTags={settings.defaultTags || []}
          onChange={handleDefaultTagsChange}
          />

        <h2 className="SettingsPage-sectionHeader">{t('licenseHeader')}</h2>
        <LicenseSettings
          license={settings.license}
          onChange={handleLicenseChange}
          />

        <h2 className="SettingsPage-sectionHeader">{t('createDocumentRegenerationBatchHeader')}</h2>
        <Button
          className="SettingsPage-createDocumentRegenerationBatchButton"
          onClick={handleCreateDocumentRegenerationBatchClick}
          >
          {t('createDocumentRegenerationBatchButton')}
        </Button>
      </div>
    </PageTemplate>
  );
}

Settings.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    settings: settingsShape.isRequired,
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired
  }).isRequired
};

export default Settings;
