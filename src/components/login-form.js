import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import Logger from '../common/logger.js';
import { useSetUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import React, { useEffect, useState } from 'react';
import { useService } from './container-context.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { ensureFormValuesAfterHydration } from '../ui/browser-helper.js';

const logger = new Logger(import.meta.url);

export default function LoginForm({
  name,
  fixedEmail,
  onLoginStarted,
  onLoginSucceeded,
  onLoginFailed,
  formRef
}) {
  const [form] = Form.useForm();
  const setUser = useSetUser();
  const { t } = useTranslation('loginForm');
  const userApiClient = useService(UserApiClient);
  const [loginError, setLoginError] = useState(null);

  if (formRef) {
    formRef.current = form;
  }

  useEffect(() => {
    ensureFormValuesAfterHydration(form, ['email', 'password']);
  }, [form]);

  const showLoginError = () => {
    setLoginError(t('loginFailed'));
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  const login = async ({ email, password }) => {
    try {
      onLoginStarted();
      const { user } = await userApiClient.login({ email, password });
      if (user) {
        setUser(user);
        onLoginSucceeded();
      } else {
        showLoginError();
        onLoginFailed();
      }
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      onLoginFailed();
    }
  };

  const handleFinish = values => {
    clearLoginError();
    const { email, password } = values;
    login({ email: email.trim(), password });
  };

  const handlePressEnter = () => {
    form.submit();
  };

  const emailValidationRules = [
    {
      required: true,
      message: t('enterEmail'),
      whitespace: true
    },
    {
      type: 'email',
      message: t('common:emailIsInvalid')
    }
  ];

  const passwordValidationRules = [
    {
      required: true,
      message: t('enterPassword')
    }
  ];

  return (
    <Form
      form={form}
      name={name}
      layout="vertical"
      className="LoginForm"
      onFinish={handleFinish}
      scrollToFirstError
      validateTrigger="onSubmit"
      >
      <Form.Item
        label={t('common:emailAddress')}
        name="email"
        rules={fixedEmail ? [] : emailValidationRules}
        initialValue={fixedEmail || ''}
        hidden={!!fixedEmail}
        >
        <Input onPressEnter={handlePressEnter} />
      </Form.Item>
      <Form.Item
        label={t('common:password')}
        name="password"
        rules={passwordValidationRules}
        >
        <Input type="password" onPressEnter={handlePressEnter} />
      </Form.Item>
      {!!loginError && <div className="LoginForm-errorMessage">{loginError}</div>}
    </Form>
  );
}

LoginForm.propTypes = {
  fixedEmail: PropTypes.string,
  formRef: PropTypes.shape({
    current: PropTypes.object
  }),
  name: PropTypes.string,
  onLoginFailed: PropTypes.func,
  onLoginStarted: PropTypes.func,
  onLoginSucceeded: PropTypes.func
};

LoginForm.defaultProps = {
  fixedEmail: null,
  formRef: null,
  name: 'login-form',
  onLoginFailed: () => {},
  onLoginStarted: () => {},
  onLoginSucceeded: () => {}
};
