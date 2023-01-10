import PropTypes from 'prop-types';
import Markdown from './markdown.js';
import React, { useState } from 'react';
import routes from './../utils/routes.js';
import Logger from './../common/logger.js';
import { Form, Button, Checkbox } from 'antd';
import { useLocale } from './locale-context.js';
import EmailFormItem from './email-form-item.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { Trans, useTranslation } from 'react-i18next';
import PasswordFormItem from './password-form-item.js';
import { handleApiError } from './../ui/error-helper.js';
import { SAVE_USER_RESULT } from './../domain/constants.js';
import DisplayNameFormItem from './displayName-form-item.js';
import UserApiClient from './../api-clients/user-api-client.js';
import PasswordConfirmationFormItem from './password-confirmation-form-item.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

function RegistrationForm({
  formRef,
  onRegistrationFailed,
  onRegistrationStarted,
  onRegistrationSucceeded
}) {
  const [form] = Form.useForm();
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const [user, setUser] = useState(null);
  const userApiClient = useService(UserApiClient);
  const { t } = useTranslation('registrationForm');
  const [forbiddenEmails, setForbiddenEmails] = useState([]);

  if (formRef) {
    formRef.current = form;
  }

  const register = async ({ email, password, displayName }) => {
    try {
      onRegistrationStarted();
      const { result, user: registeredUser } = await userApiClient.register({ email, password, displayName });
      switch (result) {
        case SAVE_USER_RESULT.success:
          setUser(registeredUser);
          onRegistrationSucceeded(registeredUser);
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          onRegistrationFailed();
          setForbiddenEmails(prevState => [...prevState, email.toLowerCase()]);
          form.validateFields(['email'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      onRegistrationFailed();
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
    <div className="RegistrationForm-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        validateTrigger="onSubmit"
        scrollToFirstError
        >
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
          <Button className="RegistrationForm-formButton" type="primary" size="large" htmlType="submit" block>
            {t('register')}
          </Button>
        </FormItem>
      </Form>
    </div>
  );

  const registrationConfirmation = (
    <Markdown className="RegistrationForm-confirmation">
      {t('registrationConfirmationMessage', { loginPageUrl: routes.getLoginUrl() })}
    </Markdown>
  );

  return (
    <div className="RegistrationForm">
      {user ? registrationConfirmation : registrationForm}
    </div>
  );
}

RegistrationForm.propTypes = {
  formRef: PropTypes.shape({
    current: PropTypes.object
  }),
  onRegistrationFailed: PropTypes.func,
  onRegistrationStarted: PropTypes.func,
  onRegistrationSucceeded: PropTypes.func
};

RegistrationForm.defaultProps = {
  formRef: null,
  onRegistrationFailed: () => {},
  onRegistrationStarted: () => {},
  onRegistrationSucceeded: () => {}
};

export default RegistrationForm;
