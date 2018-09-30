const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const PropTypes = require('prop-types');
const { formShape } = require('rc-form');
const Button = require('antd/lib/button');
const PageFooter = require('../page-footer.jsx');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const UserApiClient = require('../../services/user-api-client');

const FormItem = Form.Item;

class ResetPassword extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      isRequestSent: false
    };
  }

  requestPasswordReset({ email }) {
    const { userApiClient } = this.props;
    return userApiClient.requestPasswordReset({ email });
  }

  handleResetRequestResult() {
    this.setState({ isRequestSent: true });
  }

  handleSubmit(e) {
    e.preventDefault();
    const { form } = this.props;
    form.validateFieldsAndScroll(async (err, values) => {
      if (!err) {
        const { email } = values;
        await this.requestPasswordReset({ email });
        this.handleResetRequestResult();
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
        <PageContent fullScreen>
          <div className="ResetPasswordPage">
            <h1 className="ResetPasswordPage-title">elmu</h1>
            {isRequestSent ? resetRequestConfirmation : resetRequestForm}
          </div>
        </PageContent>
        <PageFooter fullScreen />
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
