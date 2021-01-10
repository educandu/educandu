import React from 'react';
import Page from '../page';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import ElmuLogo from '../elmu-logo';
import Countdown from '../countdown';
import Logger from '../../common/logger';
import { Form, Input, Button } from 'antd';
import { inject } from '../container-context';
import errorHelper from '../../ui/error-helper';
import { withTranslation, Trans } from 'react-i18next';
import UserApiClient from '../../services/user-api-client';
import { translationProps } from '../../ui/default-prop-types';

const logger = new Logger(__filename);

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
    try {
      const { userApiClient } = this.props;
      await userApiClient.requestPasswordReset({ email });
      this.setState({ isRequestSent: true });
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleFinish(values) {
    const { email } = values;
    this.requestPasswordReset({ email });
  }

  render() {
    const { t } = this.props;
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
      <Page fullScreen>
        <div className="ResetPasswordPage">
          <div className="ResetPasswordPage-title">
            <ElmuLogo size="big" readonly />
          </div>
          {isRequestSent ? resetRequestConfirmation : resetRequestForm}
        </div>
      </Page>
    );
  }
}

ResetPassword.propTypes = {
  ...translationProps,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('resetPassword')(inject({
  userApiClient: UserApiClient
}, ResetPassword));
