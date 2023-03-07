import gravatar from 'gravatar';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useLocale } from '../locale-context.js';
import MarkdownInput from '../markdown-input.js';
import { useDialogs } from '../dialog-context.js';
import EmailFormItem from '../email-form-item.js';
import { Trans, useTranslation } from 'react-i18next';
import { useSetUser, useUser } from '../user-context.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import DisplayNameFormItem from '../displayName-form-item.js';
import { confirmCloseAccount } from '../confirmation-dialogs.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { Form, Input, Avatar, Button, message, Radio } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import IrreversibleActionsSection from '../irreversible-actions-section.js';
import { EMAIL_NOTIFICATION_FREQUENCY, SAVE_USER_RESULT } from '../../domain/constants.js';
import { maxUserIntroductionLength, maxUserOrganizationLength } from '../../domain/validation-constants.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

const AVATAR_SIZE = 110;

function SettingsTab() {
  const user = useUser();
  const setUser = useSetUser();
  const dialogs = useDialogs();
  const { uiLanguage } = useLocale();
  const accountAccessFormRef = useRef();

  const { t } = useTranslation('settingsTab');
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const [isUserProfileFormDirty, setIsUserProfileFormDirty] = useState(false);
  const [isNotificationSettingsFormDirty, setIsNotificationSettingsFormDirty] = useState(false);
  const [accountAccessFormState, setAccountAccessFormState] = useState({ isDirty: false, email: null, forbiddenEmails: [] });

  const gravatarUrl = gravatar.url(user.email, { s: AVATAR_SIZE, d: 'mp' });
  const gravatarRegistrationUrl = `https://${uiLanguage}.gravatar.com/`;

  useEffect(() => {
    setAccountAccessFormState(prev => ({ ...prev, email: user.email, isDirty: false }));
  }, [user]);

  const emailNotificationFrequencyOptions = useMemo(() => {
    return Object.values(EMAIL_NOTIFICATION_FREQUENCY).map(value => ({ value, label: t(`emailNotificationFrequency_${value}`) }));
  }, [t]);

  const renderInfo = () => (
    <Trans
      t={t}
      i18nKey="info"
      components={[<a key="user-page-link" href={routes.getUserProfileUrl(user._id)} rel="noopener noreferrer" />]}
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

  const saveAccountAccessData = async ({ email }) => {
    try {
      const { result, user: updatedUser } = await userApiClient.saveUserAccount({ email });

      switch (result) {
        case SAVE_USER_RESULT.success:
          setUser(updatedUser);
          setAccountAccessFormState(prevState => ({ ...prevState, isDirty: false }));
          await message.success(t('updateSuccessMessage'));
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          setAccountAccessFormState(prevState => ({
            ...prevState,
            isDirty: true,
            forbiddenEmails: [
              ...prevState.forbiddenEmails,
              email.toLowerCase()
            ]
          }));
          await message.error(t('updateErrorMessage'));
          accountAccessFormRef.current.validateFields(['email'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleUserProfileFormValuesChange = () => {
    setIsUserProfileFormDirty(true);
  };

  const handleUserProfileFormFinish = async ({ displayName, organization, introduction }) => {
    try {
      const { user: updatedUser } = await userApiClient.saveUserProfile({
        displayName,
        organization,
        introduction
      });
      setUser({ ...updatedUser });
      setIsUserProfileFormDirty(false);
      message.success(t('updateSuccessMessage'));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleAccountAccessFormValuesChange = () => {
    setAccountAccessFormState(prevState => ({ ...prevState, isDirty: true }));
  };

  const handleAccountAccessFormFinish = ({ email }) => {
    dialogs.confirmWithPassword(user.email, () => saveAccountAccessData({ email }));
  };

  const handleNotificationSettingsFormValuesChange = () => {
    setIsNotificationSettingsFormDirty(true);
  };

  const handleNotificationSettingsFormFinish = async ({ emailNotificationFrequency }) => {
    try {
      const { user: updatedUser } = await userApiClient.saveUserNotificationSettings({
        emailNotificationFrequency
      });
      setUser({ ...updatedUser });
      setIsNotificationSettingsFormDirty(false);
      message.success(t('updateSuccessMessage'));
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

  const renderOrganizationInputCount = ({ count, maxLength }) => {
    return (
      <div className="u-input-count">{`${count} / ${maxLength}`}</div>
    );
  };

  return (
    <div className="AccountSettingsTab">
      <div className="AccountSettingsTab-tabInfo">{renderInfo()}</div>
      <div className="AccountSettingsTab-headline">{t('userProfileHeadline')}</div>
      <section className="AccountSettingsTab-section">
        <div className="AccountSettingsTab-avatar">
          <Avatar className="u-avatar" shape="circle" size={AVATAR_SIZE} src={gravatarUrl} alt={user.displayName} />
          <div>
            <div className="AccountSettingsTab-avatarTitle">{t('avatarTitle')}</div>
            <div className="AccountSettingsTab-avatarDescription">
              {renderAvatarDescription()}
            </div>
          </div>
        </div>

        <Form
          layout="vertical"
          onValuesChange={handleUserProfileFormValuesChange}
          onFinish={handleUserProfileFormFinish}
          >
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
            <Input
              type="text"
              maxLength={maxUserOrganizationLength}
              showCount={{ formatter: renderOrganizationInputCount }}
              />
          </FormItem>
          <FormItem
            name="introduction"
            label={t('introduction')}
            initialValue={user.introduction || ''}
            >
            <MarkdownInput preview minRows={5} maxLength={maxUserIntroductionLength} />
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit" disabled={!isUserProfileFormDirty}>{t('common:save')}</Button>
          </FormItem>
        </Form>
      </section>

      <div className="AccountSettingsTab-headline">{t('accountAccessHeadline')}</div>
      <section className="AccountSettingsTab-section">
        <Form
          layout="vertical"
          ref={accountAccessFormRef}
          onValuesChange={handleAccountAccessFormValuesChange}
          onFinish={handleAccountAccessFormFinish}
          >
          <EmailFormItem
            name="email"
            className="AccountSettingsTab-input"
            initialValue={user.email}
            emailsInUse={accountAccessFormState.forbiddenEmails}
            />
          <FormItem>
            <a href={routes.getResetPasswordUrl()}>{t('resetPassword')}</a>
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit" disabled={!accountAccessFormState.isDirty}>{t('common:save')}</Button>
          </FormItem>
        </Form>
      </section>

      <div className="AccountSettingsTab-headline">{t('notificationSettingsHeadline')}</div>
      <section className="AccountSettingsTab-section">
        <Form
          layout="vertical"
          onValuesChange={handleNotificationSettingsFormValuesChange}
          onFinish={handleNotificationSettingsFormFinish}
          >
          <FormItem
            name="emailNotificationFrequency"
            label={t('emailNotificationFrequency')}
            initialValue={user.emailNotificationFrequency}
            >
            <RadioGroup options={emailNotificationFrequencyOptions} optionType="button" />
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit" disabled={!isNotificationSettingsFormDirty}>{t('common:save')}</Button>
          </FormItem>
        </Form>
      </section>

      <IrreversibleActionsSection
        className="AccountSettingsTab-irreversibleActionsSection"
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

export default SettingsTab;
