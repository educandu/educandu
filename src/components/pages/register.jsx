const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Logger = require('../../common/logger');
const ElmuLogo = require('../elmu-logo.jsx');
const errorHelper = require('../../ui/error-helper');
const { inject } = require('../container-context.jsx');
const { Form, Input, Button, Checkbox } = require('antd');
const UserApiClient = require('../../services/user-api-client');
const { CREATE_USER_RESULT_SUCCESS, CREATE_USER_RESULT_DUPLICATE_EMAIL, CREATE_USER_RESULT_DUPLICATE_USERNAME } = require('../../domain/user-management');

const logger = new Logger(__filename);

const FormItem = Form.Item;

class Register extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.formRef = React.createRef();
    this.state = {
      user: null,
      forbiddenEmails: [],
      forbiddenUsernames: []
    };
  }

  async register({ username, password, email }) {
    try {
      const { userApiClient } = this.props;
      const { result, user } = await userApiClient.register({ username, password, email });
      switch (result) {
        case CREATE_USER_RESULT_SUCCESS:
          this.setState({ user });
          break;
        case CREATE_USER_RESULT_DUPLICATE_EMAIL:
          this.setState(prevState => ({ forbiddenEmails: [...prevState.forbiddenEmails, email.toLowerCase()] }));
          this.formRef.current.validateFields(['email'], { force: true });
          break;
        case CREATE_USER_RESULT_DUPLICATE_USERNAME:
          this.setState(prevState => ({ forbiddenUsernames: [...prevState.forbiddenUsernames, username.toLowerCase()] }));
          this.formRef.current.validateFields(['username'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleFinish(values) {
    const { username, password, email } = values;
    this.register({ username, password, email });
  }

  render() {
    const { user } = this.state;

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

    const usernameValidationRules = [
      {
        required: true,
        message: 'Bitte geben Sie einen Benutzernamen an',
        whitespace: true
      },
      {
        validator: (rule, value) => {
          const { forbiddenUsernames } = this.state;
          return value && forbiddenUsernames.includes(value.toLowerCase())
            ? Promise.reject(new Error('Der Benutzername ist bereits vergeben'))
            : Promise.resolve();
        }
      }
    ];

    const emailValidationRules = [
      {
        type: 'email',
        message: 'Ihre Eingabe ist keine gültige E-Mail-Adresse'
      },
      {
        required: true,
        message: 'Bitte geben Sie Ihre E-Mail-Adresse an'
      },
      {
        validator: (rule, value) => {
          const { forbiddenEmails } = this.state;
          return value && forbiddenEmails.includes(value.toLowerCase())
            ? Promise.reject(new Error('Diese E-Mail-Adresse ist bereits vergeben'))
            : Promise.resolve();
        }
      }
    ];

    const passwordValidationRules = [
      {
        required: true,
        message: 'Bitte geben Sie ein Kennwort an'
      }
    ];

    const passwordConfirmationValidationRules = [
      {
        required: true,
        message: 'Bitte bestätigen Sie das Kennwort'
      },
      ({ getFieldValue }) => ({
        validator: (rule, value) => {
          const otherPassword = getFieldValue('password');
          return value && value !== otherPassword
            ? Promise.reject(new Error('Die Kennwörter stimmen nicht überein'))
            : Promise.resolve();
        }
      })
    ];

    const agreementValidationRules = [
      {
        required: true,
        message: 'Bitte erklären Sie sich mit den Nutzungsbedingungen einverstanden'
      }
    ];

    const registrationForm = (
      <div className="RegisterPage-form">
        <Form ref={this.formRef} onFinish={this.handleFinish} scrollToFirstError>
          <FormItem {...formItemLayout} label="Benutzername" name="username" rules={usernameValidationRules}>
            <Input />
          </FormItem>
          <FormItem {...formItemLayout} label="E-Mail" name="email" rules={emailValidationRules}>
            <Input />
          </FormItem>
          <FormItem {...formItemLayout} label="Kennwort" name="password" rules={passwordValidationRules}>
            <Input type="password" />
          </FormItem>
          <FormItem {...formItemLayout} label="Kennwortbestätigung" name="confirm" rules={passwordConfirmationValidationRules} dependencies={['password']}>
            <Input type="password" />
          </FormItem>
          <FormItem {...tailFormItemLayout} name="agreement" valuePropName="checked" rules={agreementValidationRules}>
            <Checkbox>
              Ich habe die <a href={urls.getArticleUrl('nutzungsvertrag')}>Nutzungsbedingungen</a> gelesen und bin damit einverstanden.
            </Checkbox>
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">Registrieren</Button>
          </FormItem>
        </Form>
      </div>
    );

    const registrationConfirmation = (
      <div className="RegisterPage-confirmation">
        <p>Wir haben Ihnen eine E-Mail geschickt. Dort finden Sie die nächsten Schritte, um Ihre Registrierung abzuschließen.</p>
        <p>Zurück zur <a href="/">Startseite</a></p>
      </div>
    );

    return (
      <Page fullScreen>
        <div className="RegisterPage">
          <div className="RegisterPage-title">
            <ElmuLogo size="big" readonly />
          </div>
          {user ? registrationConfirmation : registrationForm}
        </div>
      </Page>
    );
  }
}

Register.propTypes = {
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

module.exports = inject({
  userApiClient: UserApiClient
}, Register);
