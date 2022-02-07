import iso3166 from '@unly/iso3166-1';
import Logger from '../common/logger.js';
import acceptLanguageParser from 'accept-language-parser';
import { UI_LANGUAGE_COOKIE_NAME } from '../domain/constants.js';
import { getLongLastingExpirationDateFromNow } from '../common/cookie.js';
import { SUPPORTED_UI_LANGUAGES, DEFAULT_UI_LANGUAGE } from '../resources/ui-language.js';

const logger = new Logger(import.meta.url);

class I18nController {

  handleDetectUiLanguage(req, res, next) {
    const uiLanguage = this._detectLanguageFromRequest(req);
    req.uiLanguage = uiLanguage;
    res.cookie(UI_LANGUAGE_COOKIE_NAME, uiLanguage, { expires: getLongLastingExpirationDateFromNow(), sameSite: 'lax' });
    next();
  }

  _detectLanguageFromRequest(req) {
    return this._detectLanguageFromCookie(req)
      || this._detectLanguageFromAcceptHeader(req)
      || DEFAULT_UI_LANGUAGE;
  }

  _detectLanguageFromCookie(req) {
    const langFromCookie = (req.cookies || {})[UI_LANGUAGE_COOKIE_NAME];
    return SUPPORTED_UI_LANGUAGES.includes(langFromCookie) ? langFromCookie : null;
  }

  _detectLanguageFromAcceptHeader(req) {
    const acceptLanguageHeader = req.get('accept-language');
    if (!acceptLanguageHeader) {
      return null;
    }

    let foundLanguage;
    try {
      // Resolves the best language to use, based on an array of supportedLanguages
      // acceptLanguageParser.pick returns either a language ('fr') or a locale ('fr-FR')
      const bestSupportedLanguage = acceptLanguageParser.pick(SUPPORTED_UI_LANGUAGES, acceptLanguageHeader, {
        loose: true
      });

      if (bestSupportedLanguage) {
        // Attempts to convert the language/locale into an actual language (2 chars string)
        foundLanguage = iso3166.to2(iso3166.fromLocale(bestSupportedLanguage)).toLowerCase();
      } else {
        foundLanguage = null;
      }
    } catch (error) {
      logger(error);
      foundLanguage = null;
    }

    return foundLanguage;
  }

  registerMiddleware(router) {
    router.use((req, res, next) => this.handleDetectUiLanguage(req, res, next));
  }
}

export default I18nController;
