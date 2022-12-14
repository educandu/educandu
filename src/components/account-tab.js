import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import { Form, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import EmailFormItem from './email-form-item.js';
import { useDialogs } from './dialog-context.js';
import { handleApiError } from '../ui/error-helper.js';
import { useSetUser, useUser } from './user-context.js';
import { SAVE_USER_RESULT } from '../domain/constants.js';
import React, { useEffect, useRef, useState } from 'react';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { confirmCloseAccount } from './confirmation-dialogs.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

function AccountTab() {
  const user = useUser();
  const setUser = useSetUser();
  const dialogs = useDialogs();
  const { t } = useTranslation('accountTab');
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const [state, setState] = useState({
    email: null,
    forbiddenEmails: []
  });

  useEffect(() => {
    setState(prev => ({ ...prev, email: user.email }));
  }, [user]);

  const formRef = useRef();

  const saveAccountData = async ({ email }) => {
    try {
      const { result, user: updatedUser } = await userApiClient.saveUserAccount({ email });

      switch (result) {
        case SAVE_USER_RESULT.success:
          setUser(updatedUser);
          await message.success(t('updateSuccessMessage'));
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          setState(prevState => ({ ...prevState, forbiddenEmails: [...prevState.forbiddenEmails, email.toLowerCase()] }));
          formRef.current.validateFields(['email'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleAccountFinish = ({ email }) => {
    dialogs.confirmWithPassword(user.email, () => saveAccountData({ email }));
  };

  const handleResetPasswordClick = async () => {
    try {
      await userApiClient.requestPasswordReset({ email: user.email });
      message.success(t('passwordResetEmailSent', { email: user.email }));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleCloseAccountClick = () => {
    try {
      confirmCloseAccount(t, async () => {
        await userApiClient.closeUserAccount({ userId: user._id });
        window.location = routes.getLogoutUrl();
      });
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  return (
    <div className="AccountTab">
      <div className="AccountTab-tabInfo">{t('info')}</div>
      <div className="AccountTab-headline">{t('credentialsHeadline')}</div>
      <section className="AccountTab-section">
        <Form ref={formRef} onFinish={handleAccountFinish} scrollToFirstError layout="vertical">
          <EmailFormItem name="email" emailsInUse={state.forbiddenEmails} initialValue={user.email} />
          <FormItem>
            <a onClick={handleResetPasswordClick}>{t('resetPassword')}</a>
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit">{t('common:save')}</Button>
          </FormItem>
        </Form>
      </section>
      <div className="AccountTab-headline">{t('closeAccount')}</div>
      <section className="AccountTab-section AccountTab-section--wide">
        <div>{t('closeAccountDetails')}</div>
        <Button className="AccountTab-closeAccountButton" danger type="primary" onClick={handleCloseAccountClick}>{t('closeAccount')}</Button>
      </section>
    </div>
  );
}

export default AccountTab;
