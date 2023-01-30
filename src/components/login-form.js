import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import { useSetUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from './container-context.js';
import { Button, Divider, Form, Input } from 'antd';
import PasswordFormItem from './password-form-item.js';
import { handleApiError } from '../ui/error-helper.js';
import BlockedLoginError from './blocked-login-error.js';
import ClientConfig from '../bootstrap/client-config.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { ensureFormValuesAfterHydration } from '../ui/browser-helper.js';
import { samlIdentityProviderClientShape } from '../ui/default-prop-types.js';
import ExternalAccountProviderDialog from './external-account-provider-dialog.js';
import { ERROR_CODES, FEATURE_TOGGLES, HTTP_STATUS } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

export default function LoginForm({
  name,
  redirect,
  formRef,
  fixedEmail,
  samlIdentityProviders,
  connectExternalAccount,
  showInPanel,
  showLoginButtons,
  showPasswordReset,
  onLoginStarted,
  onLoginSucceeded,
  onLoginFailed,
  onLoginBlocked
}) {
  const setUser = useSetUser();
  const [form] = Form.useForm();
  const { t } = useTranslation('loginForm');
  const clientConfig = useService(ClientConfig);
  const userApiClient = useService(UserApiClient);
  const [hasLoginFailed, setHasLoginFailed] = useState(false);
  const [isUserAccountLocked, setIsUserAccountLocked] = useState(false);
  const [hasLoginFailedTooOften, setHasLoginFailedTooOften] = useState(false);
  const [isExternalAccountProviderDialogOpen, setIsExternalAccountProviderDialogOpen] = useState(false);

  if (formRef) {
    formRef.current = form;
  }

  useEffect(() => {
    ensureFormValuesAfterHydration(form, ['email', 'password']);
  }, [form]);

  const login = async ({ email, password }) => {
    try {
      onLoginStarted();
      const { user, connectedExternalAccountId } = await userApiClient.login({ email, password, connectExternalAccount });
      if (user) {
        setUser(user);
        onLoginSucceeded(user, connectedExternalAccountId);
      } else {
        setHasLoginFailed(true);
        onLoginFailed();
      }
    } catch (error) {
      if (error.status === HTTP_STATUS.tooManyRequests) {
        setHasLoginFailedTooOften(true);
        onLoginFailed();
        onLoginBlocked();
      } else if (error.code === ERROR_CODES.userAccountLocked) {
        setIsUserAccountLocked(true);
        setHasLoginFailed(true);
        onLoginFailed();
        onLoginBlocked();
      } else {
        handleApiError({ error, logger, t });
        onLoginFailed();
      }
    }
  };

  const loginUsingExternalProvider = providerKey => {
    const provider = samlIdentityProviders.find(p => p.key === providerKey);
    window.location = routes.getSamlAuthLoginPath(provider.key, redirect);
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

  const handleLoginButtonClick = () => {
    form.submit();
  };

  const handleLoginWithShibbolethButtonClick = () => {
    if (samlIdentityProviders.length === 1) {
      const providerKey = samlIdentityProviders[0].key;
      loginUsingExternalProvider(providerKey);
    } else {
      setIsExternalAccountProviderDialogOpen(true);
    }
  };

  const handleExternalAccountProviderDialogOk = providerKey => {
    setIsExternalAccountProviderDialogOpen(false);
    loginUsingExternalProvider(providerKey);
  };

  const handleExternalAccountProviderDialogCancel = () => {
    setIsExternalAccountProviderDialogOpen(false);
  };

  const emailValidationRules = [
    {
      required: true,
      message: t('common:enterEmail'),
      whitespace: true
    },
    {
      type: 'email',
      message: t('common:emailIsInvalid')
    }
  ];

  const hasBlockingError = hasLoginFailedTooOften || isUserAccountLocked;
  const showExternalLogin = showLoginButtons && samlIdentityProviders.length
    && !clientConfig.disabledFeatures.includes(FEATURE_TOGGLES.shibbolethLoginForm);

  return (
    <div className="LoginForm">
      <div className={classNames('LoginForm-internalLogin', { 'u-panel': showInPanel })}>
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
          <PasswordFormItem name="password" skipLengthValidation onPressEnter={handlePressEnter} />
        </Form>
        {!hasBlockingError && !!hasLoginFailed && (
          <div className="LoginForm-errorMessage">{t('loginFailed')}</div>
        )}
        {!hasBlockingError && !!showPasswordReset && (
          <div className="LoginForm-forgotPasswordLink">
            <a href={routes.getResetPasswordUrl()}>{t('forgotPassword')}</a>
          </div>
        )}
        {!hasBlockingError && !!showLoginButtons && (
          <div className="LoginForm-loginButton">
            <Button type="primary" size="large" onClick={handleLoginButtonClick} block>
              {t('common:login')}
            </Button>
          </div>
        )}
        {!!hasBlockingError && (
          <BlockedLoginError type={hasLoginFailedTooOften ? 'loginFailedTooOften' : 'userAccountLocked'} />
        )}
      </div>
      {!!showExternalLogin && (
        <div className="LoginForm-externalLogin">
          <Divider>{t('common:or')}</Divider>
          <Button size="large" onClick={handleLoginWithShibbolethButtonClick} block>
            {t('loginWithShibboleth')}
          </Button>
        </div>
      )}
      <ExternalAccountProviderDialog
        providers={samlIdentityProviders}
        isOpen={isExternalAccountProviderDialogOpen}
        onOk={handleExternalAccountProviderDialogOk}
        onCancel={handleExternalAccountProviderDialogCancel}
        />
    </div>
  );
}

LoginForm.propTypes = {
  name: PropTypes.string,
  redirect: PropTypes.string,
  formRef: PropTypes.shape({
    current: PropTypes.object
  }),
  fixedEmail: PropTypes.string,
  samlIdentityProviders: PropTypes.arrayOf(samlIdentityProviderClientShape),
  connectExternalAccount: PropTypes.bool,
  showInPanel: PropTypes.bool,
  showLoginButtons: PropTypes.bool,
  showPasswordReset: PropTypes.bool,
  onLoginFailed: PropTypes.func,
  onLoginStarted: PropTypes.func,
  onLoginSucceeded: PropTypes.func,
  onLoginBlocked: PropTypes.func
};

LoginForm.defaultProps = {
  name: 'login-form',
  redirect: null,
  formRef: null,
  fixedEmail: null,
  samlIdentityProviders: [],
  connectExternalAccount: false,
  showInPanel: false,
  showLoginButtons: false,
  showPasswordReset: false,
  onLoginFailed: () => {},
  onLoginStarted: () => {},
  onLoginSucceeded: () => {},
  onLoginBlocked: () => {}
};
