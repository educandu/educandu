import React from 'react';
import Page from '../page.js';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import ElmuLogo from '../elmu-logo.js';
import Countdown from '../countdown.js';
import EmailInput from '../email-input.js';
import Logger from '../../common/logger.js';
import { Form, Button, Checkbox } from 'antd';
import { inject } from '../container-context.js';
import PasswordInput from '../password-input.js';
import UsernameInput from '../username-input.js';
import errorHelper from '../../ui/error-helper.js';
import { withSettings } from '../settings-context.js';
import { withLanguage } from '../language-context.js';
import { withTranslation, Trans } from 'react-i18next';
import UserApiClient from '../../services/user-api-client.js';
import { SAVE_USER_RESULT } from '../../domain/user-management.js';
import { languageProps, settingsProps, translationProps } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

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
        case SAVE_USER_RESULT.success:
          this.setState({ user });
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          this.setState(prevState => ({ forbiddenEmails: [...prevState.forbiddenEmails, email.toLowerCase()] }));
          this.formRef.current.validateFields(['email'], { force: true });
          break;
        case SAVE_USER_RESULT.duplicateUsername:
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
          <PasswordInput formItemLayout={formItemLayout} />
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
