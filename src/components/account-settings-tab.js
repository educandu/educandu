import gravatar from 'gravatar';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import { useLocale } from './locale-context.js';
import MarkdownInput from './markdown-input.js';
import { useDialogs } from './dialog-context.js';
import EmailFormItem from './email-form-item.js';
import { Trans, useTranslation } from 'react-i18next';
import { handleApiError } from '../ui/error-helper.js';
import { useSetUser, useUser } from './user-context.js';
import DeleteIcon from './icons/general/delete-icon.js';
import { SAVE_USER_RESULT } from '../domain/constants.js';
import React, { useEffect, useRef, useState } from 'react';
import { Form, Input, Avatar, Button, message } from 'antd';
import DisplayNameFormItem from './displayName-form-item.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import PermanentActionsCard from './permanent-actions-card.js';
import { confirmCloseAccount } from './confirmation-dialogs.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

const AVATAR_SIZE = 110;

function AccountSettingsTab() {
  const user = useUser();
  const setUser = useSetUser();
  const dialogs = useDialogs();
  const { uiLanguage } = useLocale();
  const credentialsFormRef = useRef();
  const { t } = useTranslation('accountSettingsTab');
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const [credenatialsFormState, setCredenatialsFormState] = useState({ email: null, forbiddenEmails: [] });

  const gravatarUrl = gravatar.url(user.email, { s: AVATAR_SIZE, d: 'mp' });
  const gravatarRegistrationUrl = `https://${uiLanguage}.gravatar.com/`;

  useEffect(() => {
    setCredenatialsFormState(prev => ({ ...prev, email: user.email }));
  }, [user]);

  const renderInfo = () => (
    <Trans
      t={t}
      i18nKey="info"
      components={[<a key="user-page-link" href={routes.getUserUrl(user._id)} rel="noopener noreferrer" />]}
      />
  );

  const renderAvatarDescription = () => (
    <div>
      <Trans
        t={t}
        i18nKey="avatarDescription"
        components={[<a key="gravatar-link" href={gravatarRegistrationUrl} target="_blank" rel="noopener noreferrer" />]}
        />
    </div>
  );

  const saveCredentialsData = async ({ email }) => {
    try {
      const { result, user: updatedUser } = await userApiClient.saveUserAccount({ email });

      switch (result) {
        case SAVE_USER_RESULT.success:
          setUser(updatedUser);
          await message.success(t('updateSuccessMessage'));
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          setCredenatialsFormState(prevState => ({
            ...prevState,
            forbiddenEmails: [
              ...prevState.forbiddenEmails,
              email.toLowerCase()
            ]
          }));
          credentialsFormRef.current.validateFields(['email'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handlePersonalDataFormFinish = async values => {
    try {
      const { user: updatedUser } = await userApiClient.saveUserProfile({
        displayName: values.displayName,
        organization: values.organization,
        introduction: values.introduction
      });
      setUser({ ...updatedUser });
      message.success(t('updateSuccessMessage'));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleCredentialsFormFinish = ({ email }) => {
    dialogs.confirmWithPassword(user.email, () => saveCredentialsData({ email }));
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
    <div className="AccountSettingsTab">
      <div className="AccountSettingsTab-tabInfo">{renderInfo()}</div>
      <div className="AccountSettingsTab-headline">{t('personalInfoHeadline')}</div>
      <section className="AccountSettingsTab-section">
        <div className="AccountSettingsTab-avatar">
          <Avatar className="Avatar" shape="circle" size={AVATAR_SIZE} src={gravatarUrl} alt={user.displayName} />
          <div>
            <div className="AccountSettingsTab-avatarTitle">{t('avatarTitle')}</div>
            <div className="AccountSettingsTab-avatarDescription">
              {renderAvatarDescription()}
            </div>
          </div>
        </div>

        <Form onFinish={handlePersonalDataFormFinish} scrollToFirstError layout="vertical">
          <DisplayNameFormItem
            name="displayName"
            className="AccountSettingsTab-input"
            initialValue={user.displayName}
            />
          <FormItem
            name="organization"
            label={t('organization')}
            className="AccountSettingsTab-input"
            initialValue={user.organization || ''}
            >
            <Input type="text" />
          </FormItem>
          <FormItem
            name="introduction"
            label={t('introduction')}
            initialValue={user.introduction || ''}
            >
            <MarkdownInput preview minRows={5} />
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit">{t('common:save')}</Button>
          </FormItem>
        </Form>
      </section>

      <div className="AccountSettingsTab-headline">{t('credentialsHeadline')}</div>
      <section className="AccountSettingsTab-section">
        <Form ref={credentialsFormRef} onFinish={handleCredentialsFormFinish} scrollToFirstError layout="vertical">
          <EmailFormItem
            name="email"
            className="AccountSettingsTab-input"
            initialValue={user.email}
            emailsInUse={credenatialsFormState.forbiddenEmails}
            />
          <FormItem>
            <a onClick={handleResetPasswordClick}>{t('resetPassword')}</a>
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit">{t('common:save')}</Button>
          </FormItem>
        </Form>
      </section>

      <PermanentActionsCard
        className="AccountSettingsTab-permanentActionsCard"
        actions={[
          {
            name: t('closeAccount'),
            description: t('closeAccountDetails'),
            button: {
              text: t('closeAccount'),
              icon: <DeleteIcon />,
              onClick: handleCloseAccountClick
            }
          }
        ]}
        />
    </div>
  );
}

export default AccountSettingsTab;
