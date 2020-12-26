import React from 'react';
import Page from '../page';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Input, Button } from 'antd';
import Logger from '../../common/logger';
import { inject } from '../container-context';
import errorHelper from '../../ui/error-helper';
import { settingsShape } from '../../ui/default-prop-types';
import SettingApiClient from '../../services/setting-api-client';

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
    const { settings } = this.state;

    return (
      <Page>
        <div className="SettingsPage">
          <h1>Einstellungen</h1>
          <div className="SettingsPage-formItem">
            <label className="SettingsPage-formItemLabel">Landing-Page-ID</label>
            <Input className="SettingsPage-formItemInput" value={settings.landingPageDocumentId || ''} onChange={this.handleLandingPageDocumentIdChange} />
          </div>
          <div className="SettingsPage-submitButton">
            <Button onClick={this.handleSaveClick} type="primary">Speichern</Button>
          </div>
        </div>
      </Page>
    );
  }
}

Settings.propTypes = {
  initialState: settingsShape.isRequired,
  settingApiClient: PropTypes.instanceOf(SettingApiClient).isRequired
};

export default inject({
  settingApiClient: SettingApiClient
}, Settings);
