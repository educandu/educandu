import PropTypes from 'prop-types';
import { Form, Button } from 'antd';
import urls from '../../utils/routes.js';
import Countdown from '../countdown.js';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import EmailFormItem from '../email-form-item.js';
import errorHelper from '../../ui/error-helper.js';
import { useService } from '../container-context.js';
import { Trans, useTranslation } from 'react-i18next';
import UserApiClient from '../../api-clients/user-api-client.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

function ResetPassword({ PageTemplate, SiteLogo }) {
  const { t } = useTranslation('resetPassword');
  const userApiClient = useService(UserApiClient);
  const [isRequestSent, setIsRequestSent] = useState(false);

  const requestPasswordReset = async ({ email }) => {
    try {
      await userApiClient.requestPasswordReset({ email });
      setIsRequestSent(true);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleFinish = values => {
    const { email } = values;
    requestPasswordReset({ email });
  };

  const resetRequestForm = (
    <div className="ResetPasswordPage-form">
      <Form onFinish={handleFinish} scrollToFirstError layout="vertical">
        <EmailFormItem name="email" />
        <FormItem>
          <Button className="ResetPasswordPage-formButton" type="primary" size="large" htmlType="submit" block>
            {t('requestReset')}
          </Button>
        </FormItem>
      </Form>
    </div>
  );

  const resetRequestConfirmation = (
    <div className="ResetPasswordPage-confirmation">
      <p>{t('resetInProgressConfirmation')}</p>
      <p>{t('resetInProgressNextSteps')}</p>
      <Countdown
        seconds={15}
        isRunning={!!isRequestSent}
        onComplete={() => {
          window.location = urls.getLoginUrl();
        }}
        >
        {seconds => (
          <Trans
            t={t}
            i18nKey="redirectMessage"
            values={{ seconds }}
            components={[<a key="login-link" href={urls.getLoginUrl()} />]}
            />
        )}
      </Countdown>
    </div>
  );

  return (
    <PageTemplate fullScreen>
      <div className="ResetPasswordPage">
        <div className="ResetPasswordPage-title">
          <SiteLogo readonly />
        </div>
        {isRequestSent ? resetRequestConfirmation : resetRequestForm}
      </div>
    </PageTemplate>
  );
}

ResetPassword.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default ResetPassword;
