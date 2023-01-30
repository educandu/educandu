import { Form } from 'antd';
import PropTypes from 'prop-types';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import EmailFormItem from '../email-form-item.js';
import UserStepsForm from '../user-steps-form.js';
import React, { Fragment, useState } from 'react';
import { useService } from '../container-context.js';
import PasswordFormItem from '../password-form-item.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import { PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_MINUTES } from '../../domain/constants.js';

function ResetPassword({ PageTemplate, SiteLogo }) {
  const user = useUser();
  const [enterDataForm] = Form.useForm();
  const { t } = useTranslation('resetPassword');
  const userApiClient = useService(UserApiClient);

  const [passwordResetRequestId, setPasswordResetRequestId] = useState(null);

  const handleEnterDataStart = () => {
    setPasswordResetRequestId(null);
  };

  const handleEnterDataFinish = async ({ email, password }) => {
    const response = await userApiClient.requestPasswordReset({ email, password });
    setPasswordResetRequestId(response.passwordResetRequestId);
    return true;
  };

  const handleEnterCodeFinish = async ({ verificationCode }) => {
    await userApiClient.completePasswordReset({
      passwordResetRequestId,
      verificationCode: verificationCode.trim()
    });
  };

  return (
    <PageTemplate fullScreen>
      <div className="ResetPasswordPage">
        <div className="ResetPasswordPage-title">
          <SiteLogo readonly />
        </div>
        <div className="ResetPasswordPage-form">
          <UserStepsForm
            enterDataForm={enterDataForm}
            enterDataFormContent={(
              <Fragment>
                <EmailFormItem name="email" email={user?.email} />
                <PasswordFormItem name="password" label={t('newPassword')} />
              </Fragment>
            )}
            enterDataFormButtonText={t('requestPasswordReset')}
            codeExpirationInMinutes={PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_MINUTES}
            completedMessageTitle={t('completedMessageTitle')}
            completedMessageSubtitle={t('completedMessageSubTitle')}
            onEnterDataStart={handleEnterDataStart}
            onEnterDataFinish={handleEnterDataFinish}
            onEnterCodeFinish={handleEnterCodeFinish}
            />
        </div>
      </div>
    </PageTemplate>
  );
}

ResetPassword.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default ResetPassword;
