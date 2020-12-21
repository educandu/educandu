const by = require('thenby');
const React = require('react');
const Page = require('../page.jsx');
const gravatar = require('gravatar');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const Logger = require('../../common/logger');
const localeCompare = require('locale-compare');
const { withUser } = require('../user-context.jsx');
const { withData } = require('../data-context.jsx');
const errorHelper = require('../../ui/error-helper');
const { inject } = require('../container-context.jsx');
const { CloseOutlined } = require('@ant-design/icons');
const UserApiClient = require('../../services/user-api-client');
const CountryFlagAndName = require('../country-flag-and-name.jsx');
const { userProps, dataProps } = require('../../ui/default-prop-types');
const { Form, Input, Alert, Avatar, Button, Select, message } = require('antd');

const logger = new Logger(__filename);

const FormItem = Form.Item;
const Option = Select.Option;

const AVATAR_SIZE = 256;

const compareInGerman = localeCompare('de');

class Profile extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      countryNames: Object.entries(props.data['country-names']).map(([key, name]) => ({ key, name })).sort(by(x => x.name, { cmp: compareInGerman })),
      showAvatarDescription: false
    };
  }

  async saveProfile(profileToSave) {
    try {
      const { user, userApiClient } = this.props;
      const { profile } = await userApiClient.saveUserProfile({ profile: profileToSave });
      user.profile = profile;
      message.success('Das Profil wurde erfolgreich aktualisiert.');
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleBackClick() {
    window.history.back();
  }

  handleFinish(values) {
    this.saveProfile({
      firstName: values.firstName,
      lastName: values.lastName,
      street: values.street,
      streetSupplement: values.streetSupplement,
      postalCode: values.postalCode,
      city: values.city,
      country: values.country
    });
  }

  handleShowAvatarDescriptionClick() {
    this.setState({ showAvatarDescription: true });
  }

  handleAvatarDescriptionAfterClose() {
    this.setState({ showAvatarDescription: false });
  }

  render() {
    const { countryNames, showAvatarDescription } = this.state;
    const { user } = this.props;
    const profile = user.profile || { country: '' };
    const gravatarUrl = gravatar.url(user.email, { s: AVATAR_SIZE, d: 'mp' });

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };

    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0
        },
        sm: {
          span: 16,
          offset: 8
        }
      }
    };

    const avatarDescription = (
      <div>
        ELMU verwaltet Profilbilder nicht selbst, sondern verwendet den Internetdienst <a href="https://de.gravatar.com/" target="_blank" rel="noopener noreferrer">Gravatar</a>.
        Ein Gravatar ist ein global verfügbarer Avatar (Globally Recognized Avatar), welcher mit Ihrer E-Mail-Adresse verknüpft ist.
        Dieser Dienst kann dann von anderen Webseiten benutzt werden, um ein Profilbild zu einer E-Mail-Adresse anzuzeigen.
        Beachten Sie bitte, dass ELMU keinen Einfluss auf die Verwendung Ihrer Daten bei diesem Dienst hat.
        Wenn Sie damit einverstanden sind, können Sie <a href="https://de.gravatar.com/" target="_blank" rel="noopener noreferrer">hier</a> ein Profil erstellen.
      </div>
    );

    const profileForm = (
      <div className="ProfilePage-form">
        <Form onFinish={this.handleFinish} scrollToFirstError>
          <FormItem {...tailFormItemLayout}>
            <h1>Profil</h1>
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Avatar shape="square" size={AVATAR_SIZE} src={gravatarUrl} alt={user.username} />
            <br />
            <a onClick={this.handleShowAvatarDescriptionClick}>Profilbild ändern</a>
            <br />
            {showAvatarDescription && (
              <Alert
                message="Wie ändere ich mein Profilbild?"
                description={avatarDescription}
                type="info"
                showIcon
                closable
                afterClose={this.handleAvatarDescriptionAfterClose}
                />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Vorname(n)" name="firstName" initialValue={profile.firstName || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label="Nachname" name="lastName" initialValue={profile.lastName || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label="Straße" name="street" initialValue={profile.street || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label="Straße (Zusatz)" name="streetSupplement" initialValue={profile.streetSupplement || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label="Postleitzahl" name="postalCode" initialValue={profile.postalCode || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label="Ort" name="city" initialValue={profile.city || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label="Land" name="country" initialValue={profile.country || ''}>
            <Select optionFilterProp="title" showSearch allowClear>
              {countryNames.map(cn => (
                <Option key={cn.key} value={cn.key} title={cn.name}>
                  <CountryFlagAndName code={cn.key} />
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">Speichern</Button>
          </FormItem>
        </Form>
      </div>
    );

    const headerActions = [
      {
        handleClick: this.handleBackClick,
        icon: CloseOutlined,
        key: 'close',
        text: 'Zurück'
      }
    ];

    return (
      <Page headerActions={headerActions} disableProfileWarning>
        <div className="ProfilePage">
          {profileForm}
        </div>
      </Page>
    );
  }
}

Profile.propTypes = {
  ...userProps,
  ...dataProps,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

module.exports = withUser(withData(inject({
  userApiClient: UserApiClient
}, Profile)));
