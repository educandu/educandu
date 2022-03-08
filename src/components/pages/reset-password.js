import PropTypes from 'prop-types';
import { Form, Button } from 'antd';
import urls from '../../utils/urls.js';
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

  const resetRequestForm = (
    <div className="ResetPasswordPage-form">
      <Form onFinish={handleFinish} scrollToFirstError>
        <EmailFormItem name="email" {...formItemLayout} />
        <FormItem {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">{t('requestReset')}</Button>
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
          window.location = urls.getHomeUrl();
        }}
        >
        {seconds => (
          <Trans
            t={t}
            i18nKey="redirectMessage"
            values={{ seconds }}
            components={[<a key="home-link" href={urls.getHomeUrl()} />]}
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
