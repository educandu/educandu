import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import SiteLogo from '../site-logo.js';
import Countdown from '../countdown.js';
import { Form, Input, Button } from 'antd';
import Logger from '../../common/logger.js';
import { inject } from '../container-context.js';
import errorHelper from '../../ui/error-helper.js';
import { withTranslation, Trans } from 'react-i18next';
import UserApiClient from '../../services/user-api-client.js';
import { translationProps } from '../../ui/default-prop-types.js';

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
    const { t, PageTemplate } = this.props;
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

    return (
      <PageTemplate fullScreen>
        <div className="ResetPasswordPage">
          <div className="ResetPasswordPage-title">
            <SiteLogo size="big" readonly />
          </div>
          {isRequestSent ? resetRequestConfirmation : resetRequestForm}
        </div>
      </PageTemplate>
    );
  }
}

ResetPassword.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  ...translationProps,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('resetPassword')(inject({
  userApiClient: UserApiClient
}, ResetPassword));
