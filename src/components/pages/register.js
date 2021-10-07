import React from 'react';
import urls from 'Utils/urls';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import Page from 'Components/page';
import Logger from 'Common/logger';
import errorHelper from 'UI/error-helper';
import ElmuLogo from 'Components/elmu-logo';
import Countdown from 'Components/countdown';
import EmailInput from 'Components/email-input';
import UserApiClient from 'Services/user-api-client';
import inputValidators from 'Utils/input-validators';
import { Form, Input, Button, Checkbox } from 'antd';
import { inject } from 'Components/container-context';
import UsernameInput from 'Components/username-input';
import { withTranslation, Trans } from 'react-i18next';
import { withSettings } from 'Components/settings-context';
import { withLanguage } from 'Components/language-context';
import { languageProps, settingsProps, translationProps } from 'UI/default-prop-types';
import { SAVE_USER_RESULT_SUCCESS, SAVE_USER_RESULT_DUPLICATE_EMAIL, SAVE_USER_RESULT_DUPLICATE_USERNAME } from 'Domain/user-management';

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
        case SAVE_USER_RESULT_SUCCESS:
          this.setState({ user });
          break;
        case SAVE_USER_RESULT_DUPLICATE_EMAIL:
          this.setState(prevState => ({ forbiddenEmails: [...prevState.forbiddenEmails, email.toLowerCase()] }));
          this.formRef.current.validateFields(['email'], { force: true });
          break;
        case SAVE_USER_RESULT_DUPLICATE_USERNAME:
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
    const { settings, language, t } = this.props;
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

    const passwordValidationRules = [
      {
        required: true,
        message: t('enterPassword')
      },
      {
        validator: (rule, value) => {
          const minLength = 8;
          return value && !inputValidators.isValidPassword({ password: value, minLength })
            ? Promise.reject(new Error(t('passwordIsInvalid', { length: minLength })))
            : Promise.resolve();
        }
      }
    ];

    const passwordConfirmationValidationRules = [
      {
        required: true,
        message: t('confirmPassword')
      },
      ({ getFieldValue }) => ({
        validator: (rule, value) => {
          const otherPassword = getFieldValue('password');
          return value && value !== otherPassword
            ? Promise.reject(new Error(t('passwordsDoNotMatch')))
            : Promise.resolve();
        }
      })
    ];

    const agreementValidationRules = [
      {
        required: true,
        message: t('confirmTerms')
      }
    ];

    const registrationForm = (
      <div className="RegisterPage-form">
        <Form ref={this.formRef} onFinish={this.handleFinish} scrollToFirstError>
          <UsernameInput formItemLayout={formItemLayout} forbiddenUsernames={this.state.forbiddenUsernames} />
          <EmailInput formItemLayout={formItemLayout} forbiddenEmails={this.state.forbiddenEmails} />
          <FormItem {...formItemLayout} label={t('password')} name="password" rules={passwordValidationRules}>
            <Input type="password" />
          </FormItem>
          <FormItem {...formItemLayout} label={t('passwordConfirmation')} name="confirm" rules={passwordConfirmationValidationRules} dependencies={['password']}>
            <Input type="password" />
          </FormItem>
          <FormItem {...tailFormItemLayout} name="agreement" valuePropName="checked" rules={agreementValidationRules}>
            <Checkbox>
              <Trans
                t={t}
                i18nKey="termsAndConditionsConfirmation"
                components={[
                  <a
                    key="terms-link"
                    title={settings.termsPage?.[language]?.linkTitle || null}
                    href={settings.termsPage?.[language]?.documentSlug ? urls.getArticleUrl(settings.termsPage[language].documentSlug) : '#'}
                    />
                ]}
                />
            </Checkbox>
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">{t('register')}</Button>
          </FormItem>
        </Form>
      </div>
    );

    const registrationConfirmation = (
      <div className="RegisterPage-confirmation">
        <p>{t('registrationInProgress')}</p>
        <Countdown
          seconds={10}
          isRunning={!!user}
          onComplete={() => {
            window.location = urls.getLoginUrl();
          }}
          >
          {seconds => (
            <Trans
              t={t}
              i18nKey="redirectMessage"
              values={{ seconds }}
              components={[<a key="login-link" href={urls.getLoginUrl()} />]}
              />
          )}
        </Countdown>
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
  ...settingsProps,
  ...languageProps,
  ...translationProps,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('register')(withSettings(withLanguage(inject({
  userApiClient: UserApiClient
}, Register))));
