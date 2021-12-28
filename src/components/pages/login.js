import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import { Form, Input, Button } from 'antd';
import Logger from '../../common/logger.js';
import { withUser } from '../user-context.js';
import { withTranslation } from 'react-i18next';
import { inject } from '../container-context.js';
import errorHelper from '../../ui/error-helper.js';
import { withRequest } from '../request-context.js';
import { withPageName } from '../page-name-context.js';
import { getGlobalAlerts } from '../../ui/global-alerts.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import { pageNameProps, requestProps, translationProps, userProps } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

class Login extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      loginError: null
    };
  }

  async login({ username, password }) {
    const { userApiClient, t } = this.props;
    try {
      const { user } = await userApiClient.login({ username, password });

      if (user) {
        this.redirectAfterLogin();
      } else {
        this.showLoginError();
      }
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  }

  redirectAfterLogin() {
    const { request } = this.props;
    window.location = request.query.redirect || urls.getDefaultLoginRedirectUrl();
  }

  clearLoginError() {
    this.setState({ loginError: null });
  }

  showLoginError() {
    const { t } = this.props;
    this.setState({ loginError: t('logonFailed') });
  }

  handleFinish(values) {
    this.clearLoginError();
    const { username, password } = values;
    this.login({ username, password });
  }

  render() {
    const { t, PageTemplate, SiteLogo } = this.props;
    const { loginError } = this.state;

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

    const usernameValidationRules = [
      {
        required: true,
        message: t('enterUsername'),
        whitespace: true
      }
    ];

    const passwordValidationRules = [
      {
        required: true,
        message: t('enterPassword')
      }
    ];

    const errorMessage = loginError
      ? <div className="LoginPage-errorMessage">{loginError}</div>
      : null;

    const loginForm = (
      <Form onFinish={this.handleFinish} scrollToFirstError>
        <FormItem {...formItemLayout} label={t('username')} name="username" rules={usernameValidationRules}>
          <Input />
        </FormItem>
        <FormItem {...formItemLayout} label={t('password')} name="password" rules={passwordValidationRules}>
          <Input type="password" />
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          {errorMessage}
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          <a href={urls.getResetPasswordUrl()}>{t('forgotPassword')}</a>
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">{t('logon')}</Button>
        </FormItem>
      </Form>
    );

    const alerts = getGlobalAlerts(this.props.pageName, this.props.user);

    return (
      <PageTemplate alerts={alerts} fullScreen>
        <div className="LoginPage">
          <div className="LoginPage-title">
            <SiteLogo readonly />
          </div>
          <div className="LoginPage-form">
            {loginForm}
          </div>
        </div>
      </PageTemplate>
    );
  }
}

Login.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired,
  ...translationProps,
  ...requestProps,
  ...userProps,
  ...pageNameProps,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('login')(withRequest(withUser(withPageName(inject({
  userApiClient: UserApiClient
}, Login)))));
