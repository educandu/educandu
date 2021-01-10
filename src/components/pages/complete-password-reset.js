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

    const passwordValidationRules = [
      {
        required: true,
        message: t('enterPassword')
      }
    ];

    const passwordConfirmationValidationRules = [
      {
        required: true,
        message: t('confirmPassword')
      },
      ({ getFieldValue }) => ({
        validator: (rule, value) => {
          const otherPassword = getFieldValue('password');
          return value && value !== otherPassword
            ? Promise.reject(new Error(t('passwordsDoNotMatch')))
            : Promise.resolve();
        }
      })
    ];

    const completionForm = (
      <div className="CompletePasswordResetPage-form">
        <Form onFinish={this.handleFinish} scrollToFirstError>
          <FormItem {...formItemLayout} label={t('password')} name="password" rules={passwordValidationRules}>
            <Input type="password" />
          </FormItem>
          <FormItem {...formItemLayout} label={t('passwordConfirmation')} name="confirm" rules={passwordConfirmationValidationRules} dependencies={['password']}>
            <Input type="password" />
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">{t('savePassword')}</Button>
          </FormItem>
        </Form>
      </div>
    );

    const completionConfirmation = (
      <div className="CompletePasswordResetPage-confirmation">
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

    return (
      <Page fullScreen>
        <div className="CompletePasswordResetPage">
          <div className="CompletePasswordResetPage-title">
            <ElmuLogo size="big" readonly />
          </div>
          {user ? completionConfirmation : completionForm}
        </div>
      </Page>
    );
  }
}

CompletePasswordReset.propTypes = {
  ...translationProps,
  initialState: PropTypes.shape({
    passwordResetRequestId: PropTypes.string.isRequired
  }).isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('completePasswordReset')(inject({
  userApiClient: UserApiClient
}, CompletePasswordReset));
