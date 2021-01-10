import Logger from '../common/logger';
import iso3166 from '@unly/iso3166-1';
import ServerSettings from '../bootstrap/server-settings';
import acceptLanguageParser from 'accept-language-parser';
import { SUPPORTED_UI_LANGUAGES, DEFAULT_UI_LANGUAGE, UI_LANGUAGE_COOKIE_NAME, UI_LANGUAGE_COOKIE_EXPIRES } from '../resources/ui-language';

const logger = new Logger(__filename);

class I18nController {
  static get inject() { return [ServerSettings]; }

  constructor(serverSettings) {
    this.serverSettings = serverSettings;
  }

  registerMiddleware(router) {
    router.use((req, res, next) => {
      const language = this._detectLanguageFromRequest(req);
      req.language = language;
      res.cookie(UI_LANGUAGE_COOKIE_NAME, language, { expires: UI_LANGUAGE_COOKIE_EXPIRES });
      next();
    });
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
}

export default I18nController;
