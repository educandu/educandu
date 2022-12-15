import { getNumberFromString } from '../utils/number-utils.js';

class ThemeManager {
  getTheme() {
    return this._theme;
  }

  setTheme(theme) {
    this._theme = theme;
  }

  setThemeFromLessVariables(lessVariables) {
    this._theme = {
      token: {
        // Seed tokens
        fontFamily: lessVariables['@edu-font-family'],
        fontSize: getNumberFromString(lessVariables['@edu-font-size-base']),
        borderRadius: getNumberFromString(lessVariables['@edu-border-radius-base']),
        colorPrimary: lessVariables['@edu-primary-color-light'],
        colorError: lessVariables['@edu-error-color'],
        colorSuccess: lessVariables['@edu-success-color'],
        colorInfo: lessVariables['@edu-info-color'],
        controlHeight: getNumberFromString(lessVariables['@edu-control-height-base']),

        // Map tokens
        colorText: lessVariables['@edu-text-color'],
        colorBorder: lessVariables['@edu-border-color-base'],
        colorBorderSecondary: lessVariables['@edu-border-color-light'],
        colorBgSpotlight: lessVariables['@edu-tooltip-background-color'],
        fontSizeHeading1: getNumberFromString(lessVariables['@edu-heading-1-size']),
        fontSizeHeading2: getNumberFromString(lessVariables['@edu-heading-2-size']),
        fontSizeHeading3: getNumberFromString(lessVariables['@edu-heading-3-size']),
        fontSizeHeading4: getNumberFromString(lessVariables['@edu-heading-4-size']),
        fontSizeHeading5: getNumberFromString(lessVariables['@edu-heading-5-size']),
        fontSizeLG: getNumberFromString(lessVariables['@edu-font-size-lg']),
        fontSizeSM: getNumberFromString(lessVariables['@edu-font-size-sm']),
        lineHeight: getNumberFromString(lessVariables['@edu-line-height-base']),

        // Alias tokens
        colorTextHeading: lessVariables['@edu-label-color'],
        colorTextDescription: lessVariables['@edu-text-color'],
        colorTextDisabled: lessVariables['@edu-disabled-color'],
        colorBgContainerDisabled: lessVariables['@edu-disabled-background-color'],
        colorLink: lessVariables['@edu-link-color'],
        colorLinkHover: lessVariables['@edu-link-hover-color'],
        colorLinkActive: lessVariables['@edu-link-active-color'],
        linkDecoration: lessVariables['@edu-link-decoration'],
        fontWeightStrong: getNumberFromString(lessVariables['@edu-heading-font-weight']),
        controlOutlineWidth: getNumberFromString(lessVariables['@edu-outline-width'])
      }
    };
  }
}

export default ThemeManager;
