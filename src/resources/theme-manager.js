import { getNumberFromString } from '../utils/number-utils.js';

class ThemeManager {
  constructor(lessVariables) {
    this._lessVariables = lessVariables;
  }

  getThemeToken() {
    const themeToken = {
      fontSize: getNumberFromString(this._lessVariables['@edu-font-size-base']),
      fontFamily: this._lessVariables['@edu-font-family'],
      borderRadius: getNumberFromString(this._lessVariables['@edu-border-radius-base']),
      // Active/hover input border and text color, primary button bg
      colorPrimary: this._lessVariables['@edu-primary-color-light'],
      // Input text, table pager, table headers, labels, card headers, dropdown/menu items, buttons
      colorText: this._lessVariables['@edu-text-color'],
      // Input placeholder, Switch bg, table row hover bg
      colorTextBase: this._lessVariables['@edu-text-color'],
      // Labels, table headers, collapse arrows
      colorTextHeading: this._lessVariables['@edu-text-color'],
      colorLink: this._lessVariables['@edu-link-color'],
      // Validation
      colorError: this._lessVariables['@edu-error-color'],
      // All icons
      colorSuccess: this._lessVariables['@edu-text-color-secondary'],
      colorLinkHover: this._lessVariables['@edu-link-hover-color'],
      colorLinkActive: this._lessVariables['@edu-link-active-color'],
      linkDecoration: this._lessVariables['@edu-link-decoration'],
      // Inputs, buttons in normal state
      colorBorder: this._lessVariables['@edu-border-color-base'],
      // Tabs, Table first and last, card separators
      colorBorderSecondary: this._lessVariables['@edu-border-color-base'],
      // Table header
      fontWeightStrong: 400
    };

    return themeToken;
  }
}

export default ThemeManager;
