import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import Logger from '../common/logger.js';
import { useSetUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from './container-context.js';
import { handleApiError } from '../ui/error-helper.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { ERROR_CODES, HTTP_STATUS } from '../domain/constants.js';
import BlockedLoginError from './blocked-login-error.js';
import { ensureFormValuesAfterHydration } from '../ui/browser-helper.js';

const logger = new Logger(import.meta.url);

export default function LoginForm({
  name,
  fixedEmail,
  onLoginStarted,
  onLoginSucceeded,
  onLoginFailed,
  onLoginBlocked,
  formRef
}) {
  const setUser = useSetUser();
  const [form] = Form.useForm();
  const { t } = useTranslation('loginForm');
  const userApiClient = useService(UserApiClient);
  const [hasLoginFailed, setHasLoginFailed] = useState(false);
  const [isUserLockedOut, setIsUserLockedOut] = useState(false);
  const [hasLoginFailedTooOften, setHasLoginFailedTooOften] = useState(false);

  if (formRef) {
    formRef.current = form;
  }

  useEffect(() => {
    ensureFormValuesAfterHydration(form, ['email', 'password']);
  }, [form]);

  const login = async ({ email, password }) => {
    try {
      onLoginStarted();
      const { user } = await userApiClient.login({ email, password });
      if (user) {
        setUser(user);
        onLoginSucceeded();
      } else {
        setHasLoginFailed(true);
        onLoginFailed();
      }
    } catch (error) {
      if (error.status === HTTP_STATUS.tooManyRequests) {
        setHasLoginFailedTooOften(true);
        onLoginFailed();
        onLoginBlocked();
      } else if (error.code === ERROR_CODES.userLockedOut) {
        setIsUserLockedOut(true);
        setHasLoginFailed(true);
        onLoginFailed();
        onLoginBlocked();
      } else {
        handleApiError({ error, logger, t });
        onLoginFailed();
      }
    }
  };

  const handleFinish = values => {
    setHasLoginFailed(false);
    setHasLoginFailedTooOften(false);
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

  const hasBlockingError = hasLoginFailedTooOften || isUserLockedOut;

  return (
    <div className="LoginForm">
      <Form
        form={form}
        name={name}
        layout="vertical"
        onFinish={handleFinish}
        scrollToFirstError
        validateTrigger="onSubmit"
        hidden={hasBlockingError}
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
      </Form>
      {!hasBlockingError && !!hasLoginFailed && (
        <div className="LoginForm-errorMessage">{t('loginFailed')}</div>
      )}
      {!!hasBlockingError && (
        <BlockedLoginError type={hasLoginFailedTooOften ? 'loginFailedTooOften' : 'userLockedOut'} />
      )}
    </div>
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
  onLoginSucceeded: PropTypes.func,
  onLoginBlocked: PropTypes.func
};

LoginForm.defaultProps = {
  fixedEmail: null,
  formRef: null,
  name: 'login-form',
  onLoginFailed: () => {},
  onLoginStarted: () => {},
  onLoginSucceeded: () => {},
  onLoginBlocked: () => {},
};
