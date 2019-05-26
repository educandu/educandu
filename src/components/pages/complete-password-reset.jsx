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

const GENERIC_COMPLETION_ERROR = 'Die Anforderung ist fehlgeschlagen. Bitte überprüfen Sie Ihre Eingabe.';

class CompletePasswordReset extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      confirmDirty: false,
      isCompleted: false,
      completionError: null
    };
  }

  completePasswordReset(password) {
    const { userApiClient, initialState } = this.props;
    const { passwordResetRequestId } = initialState;
    return userApiClient.completePasswordReset({ passwordResetRequestId, password });
  }

  handlePasswordResetCompletionResult({ user }) {
    if (user) {
      this.setState({ isCompleted: true });
    } else {
      this.setState({ completionError: GENERIC_COMPLETION_ERROR });
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    const { form } = this.props;
    this.setState({ completionError: null });
    form.validateFieldsAndScroll(async (err, values) => {
      if (!err) {
        const { password } = values;
        const result = await this.completePasswordReset(password);
        this.handlePasswordResetCompletionResult(result);
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
    return value && value !== otherPassword ? cb('Sie haben sich wahrscheinlich vertippt, die Kennwörter stimmen leider nicht überein') : cb();
  }

  validateToNextPassword(rule, value, cb) {
    const form = this.props.form;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    cb();
  }

  render() {
    const { isCompleted, completionError } = this.state;
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

    const passwordValidationRules = [
      {
        required: true,
        message: 'Bitte geben Sie hier ein Kennwort an'
      },
      {
        validator: this.validateToNextPassword
      }
    ];

    const passwordConfirmationValidationRules = [
      {
        required: true,
        message: 'Bitte bestätigen Sie Ihr Kennwort'
      }, {
        validator: this.compareToFirstPassword
      }
    ];

    const errorMessage = completionError
      ? <div className="CompletePasswordResetPage-errorMessage">{completionError}</div>
      : null;

    const completionForm = (
      <div className="CompletePasswordResetPage-form">
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="Kennwort">
            {getFieldDecorator('password', { rules: passwordValidationRules })(<Input type="password" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="Kennwortbestätigung">
            {getFieldDecorator('confirm', { rules: passwordConfirmationValidationRules })(<Input type="password" onBlur={this.handleConfirmBlur} />)}
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            {errorMessage}
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">Passwort speichern</Button>
          </FormItem>
        </Form>
      </div>
    );

    const completionConfirmation = (
      <div className="CompletePasswordResetPage-confirmation">
        <p>Ihr Kennwort wurde erfolgreich geändert.</p>
        <p>Klicken Sie <a href="/login">hier</a>, um sich anzumelden.</p>
      </div>
    );

    return (
      <Page fullScreen>
        <PageContent fullScreen>
          <div className="CompletePasswordResetPage">
            <h1 className="CompletePasswordResetPage-title">elmu</h1>
            {isCompleted ? completionConfirmation : completionForm}
          </div>
        </PageContent>
        <PageFooter fullScreen />
      </Page>
    );
  }
}

CompletePasswordReset.propTypes = {
  form: formShape.isRequired,
  initialState: PropTypes.shape({
    passwordResetRequestId: PropTypes.string.isRequired
  }).isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

module.exports = Form.create()(inject({
  userApiClient: UserApiClient
}, CompletePasswordReset));
