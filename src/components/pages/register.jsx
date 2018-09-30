const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const PropTypes = require('prop-types');
const { formShape } = require('rc-form');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const Checkbox = require('antd/lib/checkbox');
const PageFooter = require('../page-footer.jsx');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const UserApiClient = require('../../services/user-api-client');

const FormItem = Form.Item;

class Register extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      confirmDirty: false,
      isRegistered: false
    };
  }

  register({ username, password, email }) {
    const { userApiClient } = this.props;
    return userApiClient.register({ username, password, email });
  }

  handleRegistrationResult({ user }) {
    if (user) {
      this.setState({ isRegistered: true });
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    const { form } = this.props;
    form.validateFieldsAndScroll(async (err, values) => {
      if (!err) {
        const { username, password, email } = values;
        const result = await this.register({ username, password, email });
        this.handleRegistrationResult(result);
      }
    });
  }

  handleConfirmBlur(e) {
    const value = e.target.value;
    this.setState(prevState => ({ confirmDirty: prevState.confirmDirty || !!value }));
  }

  compareToFirstPassword(rule, value, cb) {
    const { form } = this.props;
    const otherPassword = form.getFieldValue('password');
    return value && value !== otherPassword ? cb('Die Kennwörter stimmen nicht überein') : cb();
  }

  validateToNextPassword(rule, value, cb) {
    const form = this.props.form;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    cb();
  }

  render() {
    const { isRegistered } = this.state;
    const { getFieldDecorator } = this.props.form;

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
      }
    ];

    const passwordValidationRules = [
      {
        required: true,
        message: 'Bitte geben Sie ein Kennwort an'
      },
      {
        validator: this.validateToNextPassword
      }
    ];

    const passwordConfirmationValidationRules = [
      {
        required: true,
        message: 'Bitte bestätigen Sie das Kennwort'
      }, {
        validator: this.compareToFirstPassword
      }
    ];

    const agreementValidationRules = [
      {
        required: true,
        message: 'Bitte erklären Sie sich mit den Nutzungsbedingungen einverstanden'
      }
    ];

    const agreementCheckbox = (
      <Checkbox>Ich habe die <a href={urls.getArticleUrl('nutzungsvertrag')}>Nutzungsbedingungen</a> gelesen und bin damit einverstanden.</Checkbox>
    );

    const registrationForm = (
      <div className="RegisterPage-form">
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="Benutzername">
            {getFieldDecorator('username', { rules: usernameValidationRules })(<Input />)}
          </FormItem>
          <FormItem {...formItemLayout} label="E-Mail">
            {getFieldDecorator('email', { rules: emailValidationRules })(<Input />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Kennwort">
            {getFieldDecorator('password', { rules: passwordValidationRules })(<Input type="password" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Kennwortbestätigung">
            {getFieldDecorator('confirm', { rules: passwordConfirmationValidationRules })(<Input type="password" onBlur={this.handleConfirmBlur} />)}
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            {getFieldDecorator('agreement', { valuePropName: 'checked', rules: agreementValidationRules })(agreementCheckbox)}
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
        <PageContent fullScreen>
          <div className="RegisterPage">
            <h1 className="RegisterPage-title">elmu</h1>
            {isRegistered ? registrationConfirmation : registrationForm}
          </div>
        </PageContent>
        <PageFooter fullScreen />
      </Page>
    );
  }
}

Register.propTypes = {
  form: formShape.isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

module.exports = Form.create()(inject({
  userApiClient: UserApiClient
}, Register));
