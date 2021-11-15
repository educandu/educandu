import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import { ConfigProvider } from 'antd';
import enUSNs from 'antd/lib/locale/en_US.js';
import deDENs from 'antd/lib/locale/de_DE.js';
import { I18nextProvider } from 'react-i18next';
import { useService } from './container-context.js';
import ResourceManager from '../resources/resource-manager.js';
import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  SUPPORTED_UI_LANGUAGES,
  UI_LANGUAGE_EN,
  UI_LANGUAGE_DE,
  UI_LANGUAGE_COOKIE_NAME,
  UI_LANGUAGE_COOKIE_EXPIRES,
  getLocale
} from '../resources/ui-language.js';
import { format, parseISO } from 'date-fns';
import deDeLocale from 'date-fns/locale/de/index.js';
import enUsLocale from 'date-fns/locale/en-US/index.js';

const antLocales = {
  enUS: enUSNs.default || enUSNs,
  deDE: deDENs.default || deDENs
};

const dateLocales = {
  enUS: enUsLocale,
  deDE: deDeLocale
};

const languageContext = React.createContext();

const ActualLanguageProvider = languageContext.Provider;

function createI18n(resourceManager, language) {
  return resourceManager.createI18n(language);
}

function determineAntdLocale(language) {
  switch (language) {
    case UI_LANGUAGE_EN: return antLocales.enUS;
    case UI_LANGUAGE_DE: return antLocales.deDE;
    default: throw new Error(`No locale data for language ${language}!`);
  }
}

function setLanguageCookie(language) {
  document.cookie = `${UI_LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; expires=${UI_LANGUAGE_COOKIE_EXPIRES}`;
}

const createLanguageAndLocale = memoizee(language => {
  const supportedLanguages = SUPPORTED_UI_LANGUAGES;
  const locale = getLocale(language);
  return { supportedLanguages, language, locale };
});

export function LanguageProvider({ value, children }) {
  const resourceManager = useService(ResourceManager);
  const [i18n] = useState(createI18n(resourceManager, value));
  const [antdLocale, setAntdLocale] = useState(determineAntdLocale(i18n.language));

  useEffect(() => {
    if (i18n && i18n.language !== value) {
      i18n.changeLanguage(value);
    }
  }, [i18n, value]);

  useEffect(() => {
    i18n.on('languageChanged', lng => {
      if (!SUPPORTED_UI_LANGUAGES.includes(lng)) {
        throw new Error(`Not a supported language: ${lng}!`);
      }
      setLanguageCookie(lng);
      setAntdLocale(determineAntdLocale(lng));
    });
    return () => i18n.off('languageChanged');
  }, [i18n]);

  return (
    <ActualLanguageProvider value={i18n.language}>
      <I18nextProvider i18n={i18n}>
        <ConfigProvider locale={antdLocale}>
          { children }
        </ConfigProvider>
      </I18nextProvider>
    </ActualLanguageProvider>
  );
}

LanguageProvider.propTypes = {
  children: PropTypes.node,
  value: PropTypes.string.isRequired
};

LanguageProvider.defaultProps = {
  children: null
};

export function useLanguage() {
  return createLanguageAndLocale(useContext(languageContext));
}

export function useDateFormat() {
  const { locale } = useLanguage();
  return useMemo(() => {
    const dateLocale = locale === 'de-DE' ? dateLocales.deDE : dateLocales.enUS;
    const localePattern = 'P p';
    const formatDate = (date, pattern) => date
      ? format(parseISO(date), pattern || localePattern, { locale: dateLocale })
      : '';

    return {
      formatDate
    };
  }, [locale]);
}

export function withLanguage(Component) {
  return function UserInjector(props) {
    const { language, locale } = useLanguage();
    const { formatDate } = useDateFormat();
    return <Component {...props} language={language} locale={locale} formatDate={formatDate} />;
  };
}

export default {
  LanguageProvider,
  withLanguage,
  useLanguage,
  useDateFormat
};
