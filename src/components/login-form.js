import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import React, { useState } from 'react';
import Logger from '../common/logger.js';
import { Form, Input, Button } from 'antd';
import { useSetUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { useService } from './container-context.js';
import UserApiClient from '../api-clients/user-api-client.js';

const logger = new Logger(import.meta.url);

const formItemLayouts = {
  horizontal: {
    default: {
      labelCol: { xs: { span: 24 }, sm: { span: 8 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 16 } }
    },
    tail: {
      wrapperCol: { xs: { span: 24, offset: 0 }, sm: { span: 16, offset: 8 } }
    }
  },
  vertical: {
    default: null,
    tail: null
  }
};

export default function LoginForm({
  name,
  fixedUsername,
  onLoginStarted,
  onLoginSucceeded,
  onLoginFailed,
  hidePasswordRecoveryLink,
  hideLoginButton,
  formRef,
  layout
}) {
  const [form] = Form.useForm();
  const setUser = useSetUser();
  const { t } = useTranslation('loginForm');
  const userApiClient = useService(UserApiClient);
  const [loginError, setLoginError] = useState(null);

  if (formRef) {
    formRef.current = form;
  }

  const showLoginError = () => {
    setLoginError(t('logonFailed'));
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  const login = async ({ username, password }) => {
    try {
      onLoginStarted();
      const { user } = await userApiClient.login({ username, password });
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
    const { username, password } = values;
    login({ username, password });
  };

  const usernameValidationRules = [
    {
      required: true,
      message: t('enterUsername'),
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
      layout={layout}
      form={form}
      name={name}
      className="LoginForm"
      onFinish={handleFinish}
      scrollToFirstError
      >
      <Form.Item
        {...formItemLayouts[layout].default}
        label={t('common:username')}
        name="username"
        rules={fixedUsername ? [] : usernameValidationRules}
        initialValue={fixedUsername || ''}
        hidden={!!fixedUsername}
        >
        <Input />
      </Form.Item>
      <Form.Item
        {...formItemLayouts[layout].default}
        label={t('common:password')}
        name="password"
        rules={passwordValidationRules}
        >
        <Input type="password" />
      </Form.Item>
      <Form.Item
        {...formItemLayouts[layout].tail}
        >
        {loginError ? <div className="LoginForm-errorMessage">{loginError}</div> : null}
      </Form.Item>
      {!hidePasswordRecoveryLink && (
        <Form.Item
          {...formItemLayouts[layout].tail}
          >
          <a href={urls.getResetPasswordUrl()}>{t('forgotPassword')}</a>
        </Form.Item>
      )}
      {!hideLoginButton && (
        <Form.Item
          {...formItemLayouts[layout].tail}
          >
          <Button type="primary" htmlType="submit">{t('common:logon')}</Button>
        </Form.Item>
      )}
    </Form>
  );
}

LoginForm.propTypes = {
  fixedUsername: PropTypes.string,
  formRef: PropTypes.shape({
    current: PropTypes.object
  }),
  hideLoginButton: PropTypes.bool,
  hidePasswordRecoveryLink: PropTypes.bool,
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  name: PropTypes.string,
  onLoginFailed: PropTypes.func,
  onLoginStarted: PropTypes.func,
  onLoginSucceeded: PropTypes.func
};

LoginForm.defaultProps = {
  fixedUsername: null,
  formRef: null,
  hideLoginButton: false,
  hidePasswordRecoveryLink: false,
  layout: 'horizontal',
  name: 'login-form',
  onLoginFailed: () => {},
  onLoginStarted: () => {},
  onLoginSucceeded: () => {}
};
