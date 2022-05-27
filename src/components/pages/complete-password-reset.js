import PropTypes from 'prop-types';
import { Form, Button } from 'antd';
import urls from '../../utils/routes.js';
import Countdown from '../countdown.js';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import errorHelper from '../../ui/error-helper.js';
import { useService } from '../container-context.js';
import { Trans, useTranslation } from 'react-i18next';
import PasswordFormItem from '../password-form-item.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import PasswordConfirmationFormItem from '../password-confirmation-form-item.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

function CompletePasswordReset({ initialState, PageTemplate, SiteLogo }) {
  const [user, setUser] = useState(null);
  const { t } = useTranslation('completePasswordReset');
  const userApiClient = useService(UserApiClient);

  const completePasswordReset = async password => {
    try {
      const { passwordResetRequestId } = initialState;
      const response = await userApiClient.completePasswordReset({ passwordResetRequestId, password });
      setUser(response.user);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleFinish = values => {
    const { password } = values;
    completePasswordReset(password);
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

  const completionForm = (
    <div className="CompletePasswordResetPage-form">
      <Form onFinish={handleFinish} scrollToFirstError>
        <PasswordFormItem name="password" {...formItemLayout} />
        <PasswordConfirmationFormItem name="confirm" passwordFormItemName="password" {...formItemLayout} />
        <FormItem {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">{t('savePassword')}</Button>
        </FormItem>
      </Form>
    </div>
  );

  const completionSuccessConfirmation = (
    <div className="CompletePasswordResetPage-message">
      <p>{t('passwordChangedSuccessfully')}</p>
      <Countdown
        seconds={10}
        isRunning={!!user}
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

  const completionFailureNotice = (
    <div className="CompletePasswordResetPage-message">
      <p>{t('passwordResetFailure')}</p>
      <a href={urls.getHomeUrl()}>{t('homeLink')}</a>
    </div>
  );

  const isValidRequest = !!initialState.passwordResetRequestId;

  return (
    <PageTemplate fullScreen>
      <div className="CompletePasswordResetPage">
        <div className="CompletePasswordResetPage-title">
          <SiteLogo readonly />
        </div>
        {!isValidRequest && completionFailureNotice}
        {isValidRequest && !user && completionForm}
        {isValidRequest && user && completionSuccessConfirmation}
      </div>
    </PageTemplate>
  );
}

CompletePasswordReset.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    passwordResetRequestId: PropTypes.string
  }).isRequired
};

export default CompletePasswordReset;
