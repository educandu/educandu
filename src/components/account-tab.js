import React, { useRef, useState } from 'react';
import Logger from '../common/logger.js';
import EmailInput from './email-input.js';
import { useUser } from './user-context.js';
import { Form, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import UsernameInput from './username-input.js';
import errorHelper from '../ui/error-helper.js';
import { useService } from './container-context.js';
import UserApiClient from '../services/user-api-client.js';
import { SAVE_USER_RESULT } from '../domain/user-management.js';
import { confirmIdentityWithPassword } from './confirmation-dialogs.js';
import { formItemLayoutShape, tailFormItemLayoutShape } from '../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

function AccountTab({ formItemLayout, tailFormItemLayout }) {
  const user = useUser();
  const { t } = useTranslation('accountTab');
  const userApiClient = useService(UserApiClient);

  const [state, setState] = useState({
    username: user.username,
    email: user.email,
    forbiddenEmails: [],
    forbiddenUsernames: []
  });

  const formRef = useRef(null);

  const saveAccountData = async ({ username, email }) => {
    try {
      const { result, user: updatedUser } = await userApiClient.saveUserAccount({ username, email });

      switch (result) {
        case SAVE_USER_RESULT.success:
          setState(prevState => ({ ...prevState, username: updatedUser.username, email: updatedUser.email }));
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
    confirmIdentityWithPassword({
      t,
      username: state.username,
      onOk: () => saveAccountData({ username, email }),
      userApiClient
    });
  };

  const handleResetPasswordClick = async () => {
    try {
      await userApiClient.requestPasswordReset({ email: state.email });
      message.success(t('passwordResetEmailSent', { email: state.email }));
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  return (
    <Form ref={formRef} onFinish={handleAccountFinish} scrollToFirstError>
      <UsernameInput formItemLayout={formItemLayout} forbiddenUsernames={state.forbiddenUsernames} />
      <EmailInput formItemLayout={formItemLayout} forbiddenEmails={state.forbiddenEmails} />
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
