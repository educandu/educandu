export const UI_LANGUAGE_EN = 'en';
export const UI_LANGUAGE_DE = 'de';
export const UI_LOCALE_EN_US = 'en-US';
export const UI_LOCALE_DE_DE = 'de-DE';
export const DEFAULT_UI_LANGUAGE = UI_LANGUAGE_EN;
export const SUPPORTED_UI_LANGUAGES = [UI_LANGUAGE_EN, UI_LANGUAGE_DE];
export const UI_LANGUAGE_COOKIE_NAME = 'UILANG';
export const UI_LANGUAGE_COOKIE_EXPIRES = new Date(2147483647 * 1000);

export function getLocale(language) {
  switch (language) {
    case UI_LANGUAGE_EN: return UI_LOCALE_EN_US;
    case UI_LANGUAGE_DE: return UI_LOCALE_DE_DE;
    default: throw new Error(`No locale for language ${language}!`);
  }
}
