import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Countdown from '../countdown.js';
import { Form, Input, Button } from 'antd';
import Logger from '../../common/logger.js';
import { withUser } from '../user-context.js';
import { inject } from '../container-context.js';
import errorHelper from '../../ui/error-helper.js';
import { withPageName } from '../page-name-context.js';
import { withTranslation, Trans } from 'react-i18next';
import { getGlobalAlerts } from '../../ui/global-alerts.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import { pageNameProps, translationProps, userProps } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

class ResetPassword extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      isRequestSent: false
    };
  }

  async requestPasswordReset({ email }) {
    const { userApiClient, t } = this.props;
    try {
      await userApiClient.requestPasswordReset({ email });
      this.setState({ isRequestSent: true });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  }

  handleFinish(values) {
    const { email } = values;
    this.requestPasswordReset({ email });
  }

  render() {
    const { t, pageName, user, PageTemplate, SiteLogo } = this.props;
    const { isRequestSent } = this.state;

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

    const emailValidationRules = [
      {
        required: true,
        message: t('enterEmail')
      },
      {
        type: 'email',
        message: t('emailIsInvalid')
      }
    ];

    const resetRequestForm = (
      <div className="ResetPasswordPage-form">
        <Form onFinish={this.handleFinish} scrollToFirstError>
          <FormItem {...formItemLayout} label={t('email')} name="email" rules={emailValidationRules}>
            <Input />
          </FormItem>
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

    const alerts = getGlobalAlerts(pageName, user);

    return (
      <PageTemplate alerts={alerts} fullScreen>
        <div className="ResetPasswordPage">
          <div className="ResetPasswordPage-title">
            <SiteLogo readonly />
          </div>
          {isRequestSent ? resetRequestConfirmation : resetRequestForm}
        </div>
      </PageTemplate>
    );
  }
}

ResetPassword.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired,
  ...translationProps,
  ...userProps,
  ...pageNameProps,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('resetPassword')(withUser(withPageName(inject({
  userApiClient: UserApiClient
}, ResetPassword))));
