import Alert from './alert.js';
import gravatar from 'gravatar';
import routes from '../utils/routes.js';
import React, { useState } from 'react';
import Logger from '../common/logger.js';
import { useLocale } from './locale-context.js';
import MarkdownInput from './markdown-input.js';
import { Trans, useTranslation } from 'react-i18next';
import { handleApiError } from '../ui/error-helper.js';
import { useSetUser, useUser } from './user-context.js';
import { Form, Input, Avatar, Button, message } from 'antd';
import DisplayNameFormItem from './displayName-form-item.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

const AVATAR_SIZE = 110;

function ProfileTab() {
  const user = useUser();
  const setUser = useSetUser();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('profileTab');
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const gravatarUrl = gravatar.url(user.email, { s: AVATAR_SIZE, d: 'mp' });
  const gravatarRegistrationUrl = `https://${uiLanguage}.gravatar.com/`;

  const [showAvatarDescription, setShowAvatarDescription] = useState(false);

  const handleFinish = async values => {
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

  const handleShowAvatarDescriptionClick = () => {
    setShowAvatarDescription(previousValue => !previousValue);
  };

  const handleAvatarDescriptionAfterClose = () => {
    setShowAvatarDescription(false);
  };

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

  return (
    <div className="ProfileTab">
      <div className="ProfileTab-tabInfo">{renderInfo()}</div>
      <div className="ProfileTab-headline">{t('personalInfoHeadline')}</div>
      <section className="ProfileTab-section">
        <div className="ProfileTab-avatar">
          <Avatar className="Avatar" shape="circle" size={AVATAR_SIZE} src={gravatarUrl} alt={user.displayName} />
          <a onClick={handleShowAvatarDescriptionClick}>{t('changePicture')}</a>
          {!!showAvatarDescription && (
          <Alert
            message={t('howToChangePicture')}
            description={renderAvatarDescription()}
            closable
            afterClose={handleAvatarDescriptionAfterClose}
            />
          )}
        </div>
        <Form onFinish={handleFinish} scrollToFirstError layout="vertical">
          <DisplayNameFormItem
            name="displayName"
            className="ProfileTab-input"
            initialValue={user.displayName}
            />
          <FormItem
            name="organization"
            label={t('organization')}
            className="ProfileTab-input"
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
    </div>
  );
}

export default ProfileTab;
