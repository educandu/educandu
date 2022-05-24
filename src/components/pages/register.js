import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Logger from '../../common/logger.js';
import { Form, Button, Checkbox } from 'antd';
import React, { useRef, useState } from 'react';
import { useLocale } from '../locale-context.js';
import EmailFormItem from '../email-form-item.js';
import errorHelper from '../../ui/error-helper.js';
import { useService } from '../container-context.js';
import { useSettings } from '../settings-context.js';
import { Trans, useTranslation } from 'react-i18next';
import UsernameFormItem from '../username-form-item.js';
import PasswordFormItem from '../password-form-item.js';
import { SAVE_USER_RESULT } from '../../domain/constants.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import PasswordConfirmationFormItem from '../password-confirmation-form-item.js';

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
    register({ username: username.trim(), password, email });
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
      <Form ref={formRef} onFinish={handleFinish} scrollToFirstError layout="vertical">
        <UsernameFormItem name="username" usernamesInUse={forbiddenUsernames} />
        <EmailFormItem name="email" emailsInUse={forbiddenEmails} />
        <PasswordFormItem name="password" />
        <PasswordConfirmationFormItem name="confirm" passwordFormItemName="password" />
        <FormItem name="agreement" valuePropName="checked" rules={agreementValidationRules}>
          <Checkbox>
            <Trans
              t={t}
              i18nKey="termsAndConditionsConfirmation"
              components={[
                <a
                  key="terms-link"
                  title={termsPage?.linkTitle || null}
                  href={termsPage?.documentKey ? urls.getDocUrl({ key: termsPage.documentKey }) : '#'}
                  />
              ]}
              />
          </Checkbox>
        </FormItem>
        <FormItem >
          <Button className="RegisterPage-formButton" type="primary" size="large" htmlType="submit" block>
            {t('register')}
          </Button>
        </FormItem>
      </Form>
    </div>
  );

  const registrationConfirmation = (
    <div className="RegisterPage-confirmation">
      <h1>{t('registrationConfirmationHeader')}</h1>
      <p>{t('registrationConfirmationBody')}</p>
      <p><a href={urls.getLoginUrl()}>{t('goToLoginPage')}</a></p>
    </div>
  );

  return (
    <PageTemplate fullScreen>
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
