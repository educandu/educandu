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

class CompletePasswordReset extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      confirmDirty: false,
      user: null
    };
  }

  async completePasswordReset(password) {
    try {
      const { userApiClient, initialState } = this.props;
      const { passwordResetRequestId } = initialState;
      const { user } = await userApiClient.completePasswordReset({ passwordResetRequestId, password });
      this.setState({ user });
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    const { form } = this.props;
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const { password } = values;
        this.completePasswordReset(password);
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
    const { user } = this.state;
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
        <div className="CompletePasswordResetPage">
          <div className="CompletePasswordResetPage-title">
            <ElmuLogo size="big" readonly />
          </div>
          {user ? completionConfirmation : completionForm}
        </div>
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
