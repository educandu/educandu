import { Form, Checkbox } from 'antd';
import routes from './../utils/routes.js';
import { useSetUser } from './user-context.js';
import { useLocale } from './locale-context.js';
import EmailFormItem from './email-form-item.js';
import UserStepsForm from './user-steps-form.js';
import React, { useState, Fragment } from 'react';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { Trans, useTranslation } from 'react-i18next';
import PasswordFormItem from './password-form-item.js';
import DisplayNameFormItem from './displayName-form-item.js';
import UserApiClient from './../api-clients/user-api-client.js';
import { PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES, SAVE_USER_RESULT } from './../domain/constants.js';

const FormItem = Form.Item;

function RegistrationForm() {
  const setUser = useSetUser();
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const [enterDataForm] = Form.useForm();
  const userApiClient = useService(UserApiClient);
  const { t } = useTranslation('registrationForm');
  const [createdUser, setCreatedUser] = useState(null);
  const [forbiddenEmails, setForbiddenEmails] = useState([]);

  const handleEnterDataStart = () => {
    setCreatedUser(null);
    setForbiddenEmails([]);
  };

  const handleEnterDataFinish = async ({ email, password, displayName }) => {
    const { result, user } = await userApiClient.requestRegistration({
      email: email.trim(),
      password,
      displayName: displayName.trim()
    });

    switch (result) {
      case SAVE_USER_RESULT.success:
        setCreatedUser(user);
        return true;
      case SAVE_USER_RESULT.duplicateEmail:
        setForbiddenEmails(prevState => [...prevState, email.toLowerCase()]);
        setTimeout(() => enterDataForm.validateFields(['email'], { force: true }), 0);
        return false;
      default:
        throw new Error(`Unknown result: ${result}`);
    }
  };

  const handleEnterCodeFinish = async ({ verificationCode }) => {
    const { user } = await userApiClient.completeRegistration({
      userId: createdUser._id,
      verificationCode: verificationCode.trim()
    });
    setUser(user);
    setCreatedUser(user);
  };

  const renderEnterDataFormContent = () => {
    const termsPage = settings.termsPage?.[uiLanguage];
    const agreementValidationRules = [
      {
        message: t('confirmTerms'),
        validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error(t('confirmTerms')))
      }
    ];
    return (
      <Fragment>
        <EmailFormItem name="email" emailsInUse={forbiddenEmails} />
        <PasswordFormItem name="password" />
        <DisplayNameFormItem name="displayName" />
        <FormItem name="agreement" valuePropName="checked" rules={agreementValidationRules}>
          <Checkbox className="RegistrationForm-termsAndConditionsCheckbox">
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
        <div className="RegistrationForm-alternativeActionLink">
          <a href={routes.getLoginUrl()}>{t('common:logInAlternative')}</a>
        </div>
      </Fragment>
    );
  };

  return (
    <div className="RegistrationForm">
      <UserStepsForm
        title={t('formTitle')}
        enterDataForm={enterDataForm}
        enterDataFormContent={renderEnterDataFormContent()}
        enterDataFormButtonText={t('register')}
        codeExpirationInMinutes={PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES}
        completedMessageTitle={t('completedMessageTitle')}
        completedMessageSubtitle={t('completedMessageSubTitle')}
        onEnterDataStart={handleEnterDataStart}
        onEnterDataFinish={handleEnterDataFinish}
        onEnterCodeFinish={handleEnterCodeFinish}
        />
    </div>
  );
}

export default RegistrationForm;
