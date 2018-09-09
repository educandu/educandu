const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const PropTypes = require('prop-types');
const Input = require('antd/lib/input');
const { formShape } = require('rc-form');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const { withRequest } = require('../request-context.jsx');
const UserApiClient = require('../../services/user-api-client');
const { requestProps } = require('../../ui/default-prop-types');

const FormItem = Form.Item;

const GENERIC_LOGIN_ERROR = 'Die Anmeldung ist fehlgeschlagen. Bitte überprüfen Sie Ihre Eingabe.';

class Login extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      loginError: null
    };
  }

  login({ username, password }) {
    const { userApiClient } = this.props;
    return userApiClient.login({ username, password });
  }

  handleLoginResult({ user }) {
    if (!user) {
      return this.showLoginError();
    }

    const { request } = this.props;
    return this.redirect(request.redirect || urls.getDefaultLoginRedirectUrl());
  }

  redirect(location) {
    window.location = location;
  }

  clearLoginError() {
    this.setState({
      loginError: null
    });
  }

  showLoginError() {
    this.setState({
      loginError: GENERIC_LOGIN_ERROR
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.clearLoginError();
    const { form } = this.props;
    form.validateFieldsAndScroll(async (err, values) => {
      if (!err) {
        const { username, password } = values;
        const result = await this.login({ username, password });
        form.resetFields();
        this.handleLoginResult(result);
      }
    });
  }

  render() {
    const { loginError } = this.state;
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
        message: 'Bitte geben Sie Ihren Benutzernamen an',
        whitespace: true
      }
    ];

    const passwordValidationRules = [
      {
        required: true,
        message: 'Bitte geben Sie Ihr Kennwort an'
      }
    ];

    const errorMessage = loginError
      ? <div className="LoginPage-errorMessage">{loginError}</div>
      : null;

    const loginForm = (
      <Form onSubmit={this.handleSubmit}>
        <FormItem {...formItemLayout} label="Benutzername">
          {getFieldDecorator('username', { rules: usernameValidationRules })(<Input />)}
        </FormItem>
        <FormItem {...formItemLayout} label="Kennwort">
          {getFieldDecorator('password', { rules: passwordValidationRules })(<Input type="password" />)}
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          {errorMessage}
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          <a href={urls.getResetPasswordUrl()}>Kennwort vergessen?</a>
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">Anmelden</Button>
        </FormItem>
      </Form>
    );

    return (
      <Page fullScreen>
        <PageContent>
          <div className="LoginPage">
            <h1 className="LoginPage-title">elmu</h1>
            <div className="LoginPage-form">
              {loginForm}
            </div>
          </div>
        </PageContent>
      </Page>
    );
  }
}

Login.propTypes = {
  ...requestProps,
  form: formShape.isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

module.exports = Form.create()(withRequest(inject({
  userApiClient: UserApiClient
}, Login)));
