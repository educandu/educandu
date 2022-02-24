import Logger from '../common/logger.js';
import { Form, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import UsernameInput from './username-input.js';
import EmailFormItem from './email-form-item.js';
import { useDialogs } from './dialog-context.js';
import { useSetUser, useUser } from './user-context.js';
import { SAVE_USER_RESULT } from '../domain/constants.js';
import React, { useEffect, useRef, useState } from 'react';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { formItemLayoutShape, tailFormItemLayoutShape } from '../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

function AccountTab({ formItemLayout, tailFormItemLayout }) {
  const user = useUser();
  const setUser = useSetUser();
  const dialogs = useDialogs();
  const { t } = useTranslation('accountTab');
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const [state, setState] = useState({
    forbiddenEmails: [],
    forbiddenUsernames: []
  });

  useEffect(() => {
    setState(prev => ({ ...prev, username: user.username, email: user.email }));
  }, [user]);

  const formRef = useRef();

  const saveAccountData = async ({ username, email }) => {
    try {
      const { result, user: updatedUser } = await userApiClient.saveUserAccount({ username, email });

      switch (result) {
        case SAVE_USER_RESULT.success:
          setUser(updatedUser);
          await message.success(t('updateSuccessMessage'));
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          setState(prevState => ({ ...prevState, forbiddenEmails: [...prevState.forbiddenEmails, email.toLowerCase()] }));
          formRef.current.validateFields(['email'], { force: true });
          break;
        case SAVE_USER_RESULT.duplicateUsername:
          setState(prevState => ({ ...prevState, forbiddenUsernames: [...prevState.forbiddenUsernames, username.toLowerCase()] }));
          formRef.current.validateFields(['username'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleAccountFinish = ({ username, email }) => {
    dialogs.confirmWithPassword(user.username, () => saveAccountData({ username, email }));
  };

  const handleResetPasswordClick = async () => {
    try {
      await userApiClient.requestPasswordReset({ email: user.email });
      message.success(t('passwordResetEmailSent', { email: user.email }));
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  return (
    <Form ref={formRef} onFinish={handleAccountFinish} scrollToFirstError>
      <UsernameInput formItemLayout={formItemLayout} forbiddenUsernames={state.forbiddenUsernames} />
      <EmailFormItem name="email" emailsInUse={state.forbiddenEmails} initialValue={user.email} {...formItemLayout} />
      <FormItem {...tailFormItemLayout}>
        <Button type="link" size="small" onClick={handleResetPasswordClick}>{t('resetPassword')}</Button>
      </FormItem>
      <FormItem {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">{t('common:save')}</Button>
      </FormItem>
    </Form>
  );
}

AccountTab.propTypes = {
  formItemLayout: formItemLayoutShape.isRequired,
  tailFormItemLayout: tailFormItemLayoutShape.isRequired
};

export default AccountTab;
