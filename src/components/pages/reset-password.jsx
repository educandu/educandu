const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const PropTypes = require('prop-types');
const { formShape } = require('rc-form');
const Button = require('antd/lib/button');
const ElmuLogo = require('../elmu-logo.jsx');
const Logger = require('../../common/logger');
const errorHelper = require('../../ui/error-helper');
const { inject } = require('../container-context.jsx');
const UserApiClient = require('../../services/user-api-client');

const logger = new Logger(__filename);

const FormItem = Form.Item;

class ResetPassword extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      isRequestSent: false
    };
  }

  async requestPasswordReset({ email }) {
    try {
      const { userApiClient } = this.props;
      await userApiClient.requestPasswordReset({ email });
      this.setState({ isRequestSent: true });
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    const { form } = this.props;
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const { email } = values;
        this.requestPasswordReset({ email });
      }
    });
  }

  render() {
    const { isRequestSent } = this.state;
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

    const resetRequestForm = (
      <div className="ResetPasswordPage-form">
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="E-Mail">
            {getFieldDecorator('email', { rules: emailValidationRules })(<Input />)}
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">Reset anfordern</Button>
          </FormItem>
        </Form>
      </div>
    );

    const resetRequestConfirmation = (
      <div className="ResetPasswordPage-confirmation">
        <p>Ihre Anfrage wurde ist bei uns eingegangen.</p>
        <p>
          Falls die von Ihnen angegebene E-Mail-Adresse bei uns registriert ist,
          werden Sie in Kürze eine Nachricht von uns erhalten mit den nächsten Schritte,
          um ein neues Kennwort zu generieren.
        </p>
        <p>Zurück zur <a href="/">Startseite</a></p>
      </div>
    );

    return (
      <Page fullScreen>
        <div className="ResetPasswordPage">
          <div className="ResetPasswordPage-title">
            <ElmuLogo size="big" readonly />
          </div>
          {isRequestSent ? resetRequestConfirmation : resetRequestForm}
        </div>
      </Page>
    );
  }
}

ResetPassword.propTypes = {
  form: formShape.isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

module.exports = Form.create()(inject({
  userApiClient: UserApiClient
}, ResetPassword));
