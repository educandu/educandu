import moment from 'moment';
import 'moment/locale/de.js';
import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import { ConfigProvider } from 'antd';
import enUSNs from 'antd/lib/locale/en_US.js';
import deDENs from 'antd/lib/locale/de_DE.js';
import { I18nextProvider } from 'react-i18next';
import { useService } from './container-context.js';
import { NO_BREAK_SPACE } from '../utils/string-utils.js';
import { setLongLastingCookie } from '../common/cookie.js';
import ResourceManager from '../resources/resource-manager.js';
import { UI_LANGUAGE_COOKIE_NAME } from '../domain/constants.js';
import React, { useState, useMemo, useEffect, useContext } from 'react';
import { SUPPORTED_UI_LANGUAGES, UI_LANGUAGE_EN, UI_LANGUAGE_DE, getLocale } from '../resources/ui-language.js';

const antLocales = {
  enUS: enUSNs.default || enUSNs,
  deDE: deDENs.default || deDENs
};

const localeContext = React.createContext();

const ActualLocaleProvider = localeContext.Provider;

function createI18n(resourceManager, uiLanguage) {
  return resourceManager.createI18n(uiLanguage);
}

function determineAntdLocale(uiLanguage) {
  switch (uiLanguage) {
    case UI_LANGUAGE_EN: return antLocales.enUS;
    case UI_LANGUAGE_DE: return antLocales.deDE;
    default: throw new Error(`No locale data for language ${uiLanguage}!`);
  }
}

function setUiLanguageCookie(uiLanguage) {
  setLongLastingCookie(UI_LANGUAGE_COOKIE_NAME, uiLanguage);
}

const createUiLanguageAndLocale = memoizee(uiLanguage => {
  const supportedUiLanguages = SUPPORTED_UI_LANGUAGES;
  const uiLocale = getLocale(uiLanguage);
  return { supportedUiLanguages, uiLanguage, uiLocale };
});

export function LocaleProvider({ value, children }) {
  const resourceManager = useService(ResourceManager);
  const i18n = useMemo(() => createI18n(resourceManager, value), [resourceManager, value]);
  const [antdLocale, setAntdLocale] = useState(determineAntdLocale(i18n.language));

  useEffect(() => {
    if (i18n && i18n.language !== value) {
      i18n.changeLanguage(value);
    }
  }, [i18n, value]);

  useEffect(() => {
    i18n.on('languageChanged', newUiLanguage => {
      if (!SUPPORTED_UI_LANGUAGES.includes(newUiLanguage)) {
        throw new Error(`Not a supported language: ${newUiLanguage}!`);
      }
      setUiLanguageCookie(newUiLanguage);
      setAntdLocale(determineAntdLocale(newUiLanguage));
    });
    return () => i18n.off('languageChanged');
  }, [i18n]);

  return (
    <ActualLocaleProvider value={i18n.language}>
      <I18nextProvider i18n={i18n}>
        <ConfigProvider locale={antdLocale}>
          { children }
        </ConfigProvider>
      </I18nextProvider>
    </ActualLocaleProvider>
  );
}

LocaleProvider.propTypes = {
  children: PropTypes.node,
  value: PropTypes.string.isRequired
};

LocaleProvider.defaultProps = {
  children: null
};

export function useLocale() {
  return createUiLanguageAndLocale(useContext(localeContext));
}

export function useDateFormat() {
  const { uiLocale } = useLocale();

  return useMemo(() => {
    const dateTimeFormat = uiLocale === 'de-DE' ? 'DD.MM.YYYY, HH:mm' : 'MM/DD/YYYY, HH:mm';
    const localePattern = 'L, LT';
    const numberFormat = new Intl.NumberFormat(uiLocale);

    const formatDate = date => date ? moment(date).locale(uiLocale).format(localePattern) : '';
    const formatNumber = value => numberFormat(value);

    return {
      formatDate,
      formatNumber,
      dateTimeFormat
    };
  }, [uiLocale]);
}

export function useNumberFormat() {
  const { uiLocale } = useLocale();
  return useMemo(() => {
    const numberFormatter = new Intl.NumberFormat(uiLocale, { useGrouping: true });
    return value => numberFormatter.format(value);
  }, [uiLocale]);
}

export function useNumberWithUnitFormat({ unit, useGrouping = true }) {
  const { uiLocale } = useLocale();
  return useMemo(() => {
    const unitSeparator = uiLocale === 'de-DE' ? NO_BREAK_SPACE : '';
    const numberFormatter = new Intl.NumberFormat(uiLocale, { useGrouping });
    return value => `${numberFormatter.format(value)}${unitSeparator}${unit}`;
  }, [uiLocale, unit, useGrouping]);
}

export function usePercentageFormat({ decimalPlaces = 0, integerMode = false } = { decimalPlaces: 0, integerMode: false }) {
  const { uiLocale } = useLocale();
  return useMemo(() => {
    const formatter = new Intl.NumberFormat(uiLocale, {
      style: 'percent',
      useGrouping: true,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
    return value => formatter.format(integerMode ? value / 100 : value);
  }, [uiLocale, decimalPlaces, integerMode]);
}
