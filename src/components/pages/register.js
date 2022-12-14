import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { Form, Button, Checkbox } from 'antd';
import React, { useRef, useState } from 'react';
import { useLocale } from '../locale-context.js';
import EmailFormItem from '../email-form-item.js';
import { useService } from '../container-context.js';
import { useSettings } from '../settings-context.js';
import { Trans, useTranslation } from 'react-i18next';
import PasswordFormItem from '../password-form-item.js';
import { handleApiError } from '../../ui/error-helper.js';
import { SAVE_USER_RESULT } from '../../domain/constants.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import PasswordConfirmationFormItem from '../password-confirmation-form-item.js';
import DisplayNameFormItem from '../displayName-form-item.js';

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

  const register = async ({ email, password, displayName }) => {
    try {
      const { result, user: registeredUser } = await userApiClient.register({ email, password, displayName });
      switch (result) {
        case SAVE_USER_RESULT.success:
          setUser(registeredUser);
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          setForbiddenEmails(prevState => [...prevState, email.toLowerCase()]);
          formRef.current.validateFields(['email'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleFinish = values => {
    const { email, password, displayName } = values;
    register({ email, password, displayName: displayName.trim() });
  };

  const agreementValidationRules = [
    {
      message: t('confirmTerms'),
      validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error(t('confirmTerms')))
    }
  ];

  const termsPage = settings.termsPage?.[uiLanguage];

  const registrationForm = (
    <div className="RegisterPage-form">
      <Form ref={formRef} onFinish={handleFinish} scrollToFirstError layout="vertical">
        <EmailFormItem name="email" emailsInUse={forbiddenEmails} />
        <PasswordFormItem name="password" />
        <PasswordConfirmationFormItem name="confirm" passwordFormItemName="password" />
        <DisplayNameFormItem name="displayName" />
        <FormItem name="agreement" valuePropName="checked" rules={agreementValidationRules}>
          <Checkbox>
            <Trans
              t={t}
              i18nKey="termsAndConditionsConfirmation"
              components={[
                <a
                  key="terms-link"
                  title={termsPage?.linkTitle || null}
                  href={termsPage?.documentId ? routes.getDocUrl({ id: termsPage.documentId }) : '#'}
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
    <Markdown className="RegisterPage-confirmation">
      {t('registrationConfirmationMessage', { loginPageUrl: routes.getLoginUrl() })}
    </Markdown>
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
