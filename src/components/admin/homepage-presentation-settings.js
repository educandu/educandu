import { Form } from 'antd';
import PropTypes from 'prop-types';
import React, { memo } from 'react';
import UrlInput from '../url-input.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import DocumentSelector from '../document-selector.js';
import LanguageIcon from '../localization/language-icon.js';
import { ADMIN_PAGE_FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { settingsHomepagePresentationPerLanguageShape } from '../../ui/default-prop-types.js';

const FormItem = Form.Item;

const ensureSettings = (supportedUiLanguages, settings) => {
  return supportedUiLanguages.reduce((mappedSettings, uiLanguage) => {
    mappedSettings[uiLanguage] = {
      videoSourceUrl: settings[uiLanguage]?.videoSourceUrl || '',
      posterImageSourceUrl: settings[uiLanguage]?.posterImageSourceUrl || '',
      aboutDocumentId: settings[uiLanguage]?.aboutDocumentId || ''
    };
    return mappedSettings;
  }, {});
};

function HomepagePresentationSettings({ settings, onChange }) {
  const { supportedUiLanguages } = useLocale();
  const { t } = useTranslation('homepagePresentationSettings');

  const handleVideoSourceUrlChange = (languageCode, value) => {
    const newSettings = ensureSettings(supportedUiLanguages, settings);
    newSettings[languageCode].videoSourceUrl = value;
    onChange(newSettings);
  };

  const handlePosterImageSourceUrlChange = (languageCode, value) => {
    const newSettings = ensureSettings(supportedUiLanguages, settings);
    newSettings[languageCode].posterImageSourceUrl = value;
    onChange(newSettings);
  };

  const handleAboutDocumentIdChange = (languageCode, value) => {
    const newSettings = ensureSettings(supportedUiLanguages, settings);
    newSettings[languageCode].aboutDocumentId = value;
    onChange(newSettings);
  };

  const renderInputsForLanguage = languageCode => {
    const settingsItem = settings[languageCode];
    return (
      <div className="HomepagePresentationSettings-group" key={languageCode}>
        <div className="HomepagePresentationSettings-groupLanguage" ><LanguageIcon language={languageCode} /></div>
        <FormItem {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('videoSourceUrl')}>
          <UrlInput
            value={settingsItem?.videoSourceUrl}
            onChange={value => handleVideoSourceUrlChange(languageCode, value)}
            />
        </FormItem>
        <FormItem {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('common:posterImageUrl')}>
          <UrlInput
            value={settingsItem?.posterImageSourceUrl}
            onChange={value => handlePosterImageSourceUrlChange(languageCode, value)}
            />
        </FormItem>
        <FormItem {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('aboutDocument')}>
          <DocumentSelector
            documentId={settingsItem?.aboutDocumentId}
            onChange={value => handleAboutDocumentIdChange(languageCode, value)}
            />
        </FormItem>
      </div>
    );
  };

  return (
    <Form className="HomepagePresentationSettings">
      {supportedUiLanguages.map(renderInputsForLanguage)}
    </Form>
  );
}

HomepagePresentationSettings.propTypes = {
  settings: PropTypes.objectOf(settingsHomepagePresentationPerLanguageShape),
  onChange: PropTypes.func.isRequired
};

HomepagePresentationSettings.defaultProps = {
  settings: {}
};

export default memo(HomepagePresentationSettings);
