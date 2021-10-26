import React from 'react';
import Page from '../page.js';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Form, Button } from 'antd';
import urls from '../../utils/urls.js';
import ElmuLogo from '../elmu-logo.js';
import Countdown from '../countdown.js';
import Logger from '../../common/logger.js';
import { inject } from '../container-context.js';
import PasswordInput from '../password-input.js';
import errorHelper from '../../ui/error-helper.js';
import { withTranslation, Trans } from 'react-i18next';
import UserApiClient from '../../services/user-api-client.js';
import { translationProps } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

class CompletePasswordReset extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      user: null
    };
  }

  async completePasswordReset(password) {
    try {
      const { userApiClient, initialState } = this.props;
      const { passwordResetRequestId } = initialState;
      const { user } = await userApiClient.completePasswordReset({ passwordResetRequestId, password });
      this.setState({ user });
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleFinish(values) {
    const { password } = values;
    this.completePasswordReset(password);
  }

  render() {
    const { t } = this.props;
    const { user } = this.state;

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
        <Form onFinish={this.handleFinish} scrollToFirstError>
          <PasswordInput formItemLayout={formItemLayout} />
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

    const isValidRequest = !!this.props.initialState.passwordResetRequestId;

    return (
      <Page fullScreen>
        <div className="CompletePasswordResetPage">
          <div className="CompletePasswordResetPage-title">
            <ElmuLogo size="big" readonly />
          </div>
          {!isValidRequest && completionFailureNotice}
          {isValidRequest && !user && completionForm}
          {isValidRequest && user && completionSuccessConfirmation}
        </div>
      </Page>
    );
  }
}

CompletePasswordReset.propTypes = {
  ...translationProps,
  initialState: PropTypes.shape({
    passwordResetRequestId: PropTypes.string
  }).isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('completePasswordReset')(inject({
  userApiClient: UserApiClient
}, CompletePasswordReset));
