import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import React, { useState } from 'react';
import { Form, Input, Button } from 'antd';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../../ui/error-helper.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import UserApiClient from '../../api-clients/user-api-client.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

function Login({ PageTemplate, SiteLogo }) {
  const request = useRequest();
  const { t } = useTranslation('login');
  const userApiClient = useService(UserApiClient);

  const [loginError, setLoginError] = useState(null);

  const redirectAfterLogin = () => {
    window.location = request.query.redirect || urls.getDefaultLoginRedirectUrl();
  };

  const showLoginError = () => {
    setLoginError(t('logonFailed'));
  };

  const login = async ({ username, password }) => {
    try {
      const { user } = await userApiClient.login({ username, password });

      if (user) {
        redirectAfterLogin();
      } else {
        showLoginError();
      }
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  const handleFinish = values => {
    clearLoginError();
    const { username, password } = values;
    login({ username, password });
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

  const errorMessage = loginError
    ? <div className="LoginPage-errorMessage">{loginError}</div>
    : null;

  const loginForm = (
    <Form onFinish={handleFinish} scrollToFirstError>
      <FormItem {...formItemLayout} label={t('username')} name="username" rules={usernameValidationRules}>
        <Input />
      </FormItem>
      <FormItem {...formItemLayout} label={t('password')} name="password" rules={passwordValidationRules}>
        <Input type="password" />
      </FormItem>
      <FormItem {...tailFormItemLayout}>
        {errorMessage}
      </FormItem>
      <FormItem {...tailFormItemLayout}>
        <a href={urls.getResetPasswordUrl()}>{t('forgotPassword')}</a>
      </FormItem>
      <FormItem {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">{t('logon')}</Button>
      </FormItem>
    </Form>
  );

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts} fullScreen>
      <div className="LoginPage">
        <div className="LoginPage-title">
          <SiteLogo readonly />
        </div>
        <div className="LoginPage-form">
          {loginForm}
        </div>
      </div>
    </PageTemplate>
  );
}

Login.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default Login;
