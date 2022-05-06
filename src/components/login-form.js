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
  fixedEmailOrUsername,
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
    ensureFormValuesAfterHydration(form, ['emailOrUsername', 'password']);
  }, [form]);

  const showLoginError = () => {
    setLoginError(t('logonFailed'));
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  const login = async ({ emailOrUsername, password }) => {
    try {
      onLoginStarted();
      const { user } = await userApiClient.login({ emailOrUsername, password });
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
    const { emailOrUsername, password } = values;
    login({ emailOrUsername: emailOrUsername.trim(), password });
  };

  const handlePressEnter = () => {
    form.submit();
  };

  const emailOrUsernameValidationRules = [
    {
      required: true,
      message: t('enterEmailOrUsername'),
      whitespace: true
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
      >
      <Form.Item
        label={t('emailOrUsername')}
        name="emailOrUsername"
        rules={fixedEmailOrUsername ? [] : emailOrUsernameValidationRules}
        initialValue={fixedEmailOrUsername || ''}
        hidden={!!fixedEmailOrUsername}
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
  fixedEmailOrUsername: PropTypes.string,
  formRef: PropTypes.shape({
    current: PropTypes.object
  }),
  name: PropTypes.string,
  onLoginFailed: PropTypes.func,
  onLoginStarted: PropTypes.func,
  onLoginSucceeded: PropTypes.func
};

LoginForm.defaultProps = {
  fixedEmailOrUsername: null,
  formRef: null,
  name: 'login-form',
  onLoginFailed: () => {},
  onLoginStarted: () => {},
  onLoginSucceeded: () => {}
};
