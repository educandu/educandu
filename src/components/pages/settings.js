import React from 'react';
import Page from '../page';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Input, Button } from 'antd';
import Logger from '../../common/logger';
import { inject } from '../container-context';
import errorHelper from '../../ui/error-helper';
import { withTranslation } from 'react-i18next';
import SettingApiClient from '../../services/setting-api-client';
import { settingsShape, translationProps } from '../../ui/default-prop-types';

const logger = new Logger(__filename);

class Settings extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      settings: props.initialState
    };
  }

  handleLandingPageDocumentIdChange(event) {
    const value = event.target.value || null;
    this.setState(prevState => ({
      ...prevState,
      settings: {
        ...prevState.settings,
        landingPageDocumentId: value
      }
    }));
  }

  async handleSaveClick() {
    const { settings } = this.state;
    const { settingApiClient } = this.props;
    try {
      await settingApiClient.saveSettings({ settings });
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  render() {
    const { t } = this.props;
    const { settings } = this.state;

    return (
      <Page>
        <div className="SettingsPage">
          <h1>{t('pageNames:settings')}</h1>
          <div className="SettingsPage-formItem">
            <label className="SettingsPage-formItemLabel">{t('landingPageKey')}</label>
            <Input className="SettingsPage-formItemInput" value={settings.landingPageDocumentId || ''} onChange={this.handleLandingPageDocumentIdChange} />
          </div>
          <div className="SettingsPage-submitButton">
            <Button onClick={this.handleSaveClick} type="primary">{t('common:save')}</Button>
          </div>
        </div>
      </Page>
    );
  }
}

Settings.propTypes = {
  ...translationProps,
  initialState: settingsShape.isRequired,
  settingApiClient: PropTypes.instanceOf(SettingApiClient).isRequired
};

export default withTranslation('settings')(inject({
  settingApiClient: SettingApiClient
}, Settings));
