import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Countdown from '../countdown.js';
import Logger from '../../common/logger.js';
import { Form, Button, Checkbox } from 'antd';
import React, { useRef, useState } from 'react';
import PasswordInput from '../password-input.js';
import UsernameInput from '../username-input.js';
import { useLocale } from '../locale-context.js';
import EmailFormItem from '../email-form-item.js';
import errorHelper from '../../ui/error-helper.js';
import { useService } from '../container-context.js';
import { useSettings } from '../settings-context.js';
import { Trans, useTranslation } from 'react-i18next';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { SAVE_USER_RESULT } from '../../domain/constants.js';
import UserApiClient from '../../api-clients/user-api-client.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

function Register({ PageTemplate, SiteLogo }) {
  const formRef = useRef(null);
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('register');
  const userApiClient = useService(UserApiClient);

  const [user, setUser] = useState(null);
  const [forbiddenEmails, setForbiddenEmails] = useState([]);
  const [forbiddenUsernames, setForbiddenUsernames] = useState([]);

  const register = async ({ username, password, email }) => {
    try {
      const { result, user: registeredUser } = await userApiClient.register({ username, password, email });
      switch (result) {
        case SAVE_USER_RESULT.success:
          setUser(registeredUser);
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          setForbiddenEmails(prevState => [...prevState, email.toLowerCase()]);
          formRef.current.validateFields(['email'], { force: true });
          break;
        case SAVE_USER_RESULT.duplicateUsername:
          setForbiddenUsernames(prevState => [...prevState, username.toLowerCase()]);
          formRef.current.validateFields(['username'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleFinish = values => {
    const { username, password, email } = values;
    register({ username, password, email });
  };

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
      message: t('confirmTerms'),
      validator: (_, value) => value
        ? Promise.resolve()
        : Promise.reject(new Error(t('confirmTerms')))
    }
  ];

  const termsPage = settings.termsPage?.[uiLanguage];

  const registrationForm = (
    <div className="RegisterPage-form">
      <Form ref={formRef} onFinish={handleFinish} scrollToFirstError>
        <UsernameInput formItemLayout={formItemLayout} forbiddenUsernames={forbiddenUsernames} />
        <EmailFormItem name="email" emailsInUse={forbiddenEmails} {...formItemLayout} />
        <PasswordInput formItemLayout={formItemLayout} />
        <FormItem {...tailFormItemLayout} name="agreement" valuePropName="checked" rules={agreementValidationRules}>
          <Checkbox>
            <Trans
              t={t}
              i18nKey="termsAndConditionsConfirmation"
              components={[
                <a
                  key="terms-link"
                  title={termsPage?.linkTitle || null}
                  href={termsPage?.documentKey ? urls.getDocUrl({ key: termsPage.documentKey, slug: termsPage.documentSlug }) : '#'}
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

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts} fullScreen>
      <div className="RegisterPage">
        <div className="RegisterPage-title">
          <SiteLogo readonly />
        </div>
        {user ? registrationConfirmation : registrationForm}
      </div>
    </PageTemplate>
  );
}

Register.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default Register;
