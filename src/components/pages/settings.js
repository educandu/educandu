import Page from '../page';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Logger from '../../common/logger';
import { useTranslation } from 'react-i18next';
import errorHelper from '../../ui/error-helper';
import { useService } from '../container-context';
import permissions from '../../domain/permissions';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import SettingApiClient from '../../services/setting-api-client';
import SpecialPageSettings from '../settings/special-page-settings';
import HomeLanguagesSettings from '../settings/home-languages-settings';
import { documentMetadataShape, settingsShape } from '../../ui/default-prop-types';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/immutable-array-utils';
import FooterLinksSettings from '../settings/footer-links-settings';

const logger = new Logger(__filename);

function Settings({ initialState }) {
  const { t } = useTranslation('settings');
  const settingApiClient = useService(SettingApiClient);
  const [settings, setSettings] = useState(initialState.settings);
  const [dirtyKeys, setDirtyKeys] = useState([]);
  const [invalidKeys, setInvalidKeys] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState(initialState.settings);

  const handleChange = (key, value, isValid) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirtyKeys(prev => ensureIsIncluded(prev, key));
    setInvalidKeys(prev => isValid ? ensureIsExcluded(prev, key) : ensureIsIncluded(prev, key));
  };

  const handleSaveClick = async () => {
    const changedSettings = dirtyKeys.reduce((map, key) => ({ ...map, [key]: settings[key] }), {});
    try {
      setIsUpdating(true);
      await settingApiClient.saveSettings({ settings: changedSettings });
      setLastSavedSettings({ ...initialState.settings, ...changedSettings });
      setDirtyKeys([]);
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelClick = () => {
    setSettings(lastSavedSettings);
    setDirtyKeys([]);
    setInvalidKeys([]);
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

  return (
    <Page headerActions={headerActions}>
      <div className="SettingsPage">
        <h1>{t('pageNames:settings')}</h1>
        <h2 className="SettingsPage-sectionHeader">{t('homeLanguagesHeader')}</h2>
        <p>{t('homeLanguagesSubHeader')}</p>
        <HomeLanguagesSettings
          homeLanguages={settings.homeLanguages}
          documents={initialState.documents}
          onChange={(value, { isValid }) => handleChange('homeLanguages', value, isValid)}
          />
        <h2 className="SettingsPage-sectionHeader">{t('helpPageHeader')}</h2>
        <SpecialPageSettings
          settings={settings.helpPage}
          documents={initialState.documents}
          onChange={(value, { isValid }) => handleChange('helpPage', value, isValid)}
          />
        <h2 className="SettingsPage-sectionHeader">{t('termsPageHeader')}</h2>
        <SpecialPageSettings
          settings={settings.termsPage}
          documents={initialState.documents}
          onChange={(value, { isValid }) => handleChange('termsPage', value, isValid)}
          />
        <h2 className="SettingsPage-sectionHeader">{t('footerLinksHeader')}</h2>
        <FooterLinksSettings
          footerLinks={settings.footerLinks}
          documents={initialState.documents}
          onChange={(value, { isValid }) => handleChange('footerLinks', value, isValid)}
          />
      </div>
    </Page>
  );
}

Settings.propTypes = {
  initialState: PropTypes.shape({
    settings: settingsShape.isRequired,
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired
  }).isRequired
};

export default Settings;
