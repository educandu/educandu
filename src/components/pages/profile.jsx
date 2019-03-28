const by = require('thenby');
const React = require('react');
const Page = require('../page.jsx');
const gravatar = require('gravatar');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const Alert = require('antd/lib/alert');
const PropTypes = require('prop-types');
const { formShape } = require('rc-form');
const Avatar = require('antd/lib/avatar');
const Button = require('antd/lib/button');
const Select = require('antd/lib/select');
const message = require('antd/lib/message');
const localeCompare = require('locale-compare');
const PageHeader = require('../page-header.jsx');
const PageFooter = require('../page-footer.jsx');
const PageContent = require('../page-content.jsx');
const { withUser } = require('../user-context.jsx');
const { withData } = require('../data-context.jsx');
const { inject } = require('../container-context.jsx');
const UserApiClient = require('../../services/user-api-client');
const CountryFlagAndName = require('../country-flag-and-name.jsx');
const { userProps, dataProps } = require('../../ui/default-prop-types');

const FormItem = Form.Item;
const Option = Select.Option;

const AVATAR_SIZE = 256;

const compareInGerman = localeCompare('de');

class Profile extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      countryNames: Object.entries(props.data['country-names']).map(([key, name]) => ({ key, name })).sort(by(x => x.name, { cmp: compareInGerman })),
      showAvatarDescription: false
    };
  }

  saveProfile(profile) {
    const { userApiClient } = this.props;
    return userApiClient.saveUserProfile({ profile });
  }

  handleBackClick() {
    if (window.history && window.history.back) {
      window.history.back();
    }
  }

  handleSubmitResult({ profile }) {
    if (profile) {
      this.props.user.profile = profile;
      message.success('Das Profil wurde erfolgreich aktualisiert.');
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    const { form } = this.props;
    form.validateFieldsAndScroll(async (err, values) => {
      if (!err) {
        const profile = {
          firstName: values.firstName,
          lastName: values.lastName,
          street: values.street,
          streetSupplement: values.streetSupplement,
          postalCode: values.postalCode,
          city: values.city,
          country: values.country
        };
        const result = await this.saveProfile(profile);
        this.handleSubmitResult(result);
      }
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
    const { user, form } = this.props;
    const { getFieldDecorator } = form;
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

    const countryList = (
      <Select optionFilterProp="title" firstActiveValue="DE" showSearch allowClear>
        {countryNames.map(cn => (
          <Option key={cn.key} value={cn.key} title={cn.name}>
            <CountryFlagAndName code={cn.key} />
          </Option>
        ))}
      </Select>
    );

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
        <h2>Profil</h2>
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...tailFormItemLayout}>
            <Avatar shape="square" size={AVATAR_SIZE} src={gravatarUrl} alt={user.username} />
            <br />
            <a onClick={this.handleShowAvatarDescriptionClick}>Profilbild ändern</a>
            <br />
            {showAvatarDescription && <Alert
              message="Wie ändere ich mein Profilbild?"
              description={avatarDescription}
              type="info"
              showIcon
              closable
              afterClose={this.handleAvatarDescriptionAfterClose}
              />}
          </FormItem>
          <FormItem {...formItemLayout} label="Vorname(n)">
            {getFieldDecorator('firstName', { initialValue: profile.firstName || '' })(<Input type="text" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Nachname">
            {getFieldDecorator('lastName', { initialValue: profile.lastName || '' })(<Input type="text" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Straße">
            {getFieldDecorator('street', { initialValue: profile.street || '' })(<Input type="text" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Straße (Zusatz)">
            {getFieldDecorator('streetSupplement', { initialValue: profile.streetSupplement || '' })(<Input type="text" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Postleitzahl">
            {getFieldDecorator('postalCode', { initialValue: profile.postalCode || '' })(<Input type="text" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Ort">
            {getFieldDecorator('city', { initialValue: profile.city || '' })(<Input type="text" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Land">
            {getFieldDecorator('country', { initialValue: profile.country || '' })(countryList)}
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">Speichern</Button>
          </FormItem>
        </Form>
      </div>
    );

    return (
      <Page>
        <PageHeader disableProfileWarning>
          <Button icon="close" onClick={this.handleBackClick}>Zurück</Button>
        </PageHeader>
        <PageContent>
          <div className="ProfilePage">
            {profileForm}
          </div>
        </PageContent>
        <PageFooter />
      </Page>
    );
  }
}

Profile.propTypes = {
  ...userProps,
  ...dataProps,
  form: formShape.isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

module.exports = Form.create()(withUser(withData(inject({
  userApiClient: UserApiClient
}, Profile))));
