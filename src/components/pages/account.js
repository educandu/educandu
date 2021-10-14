import by from 'thenby';
import React from 'react';
import Page from '../page';
import gravatar from 'gravatar';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import EmailInput from '../email-input';
import Logger from '../../common/logger';
import localeCompare from 'locale-compare';
import { withUser } from '../user-context';
import { inject } from '../container-context';
import UsernameInput from '../username-input';
import errorHelper from '../../ui/error-helper';
import { CloseOutlined } from '@ant-design/icons';
import { withLanguage } from '../language-context';
import { Trans, withTranslation } from 'react-i18next';
import UserApiClient from '../../services/user-api-client';
import CountryNameProvider from '../../data/country-name-provider';
import CountryFlagAndName from '../localization/country-flag-and-name';
import { Form, Input, Alert, Avatar, Button, Select, message } from 'antd';
import { userProps, languageProps, translationProps } from '../../ui/default-prop-types';
import { SAVE_USER_RESULT } from '../../domain/user-management';
import { confirmIdentityWithPassword } from '../confirmation-dialogs';

const logger = new Logger(__filename);

const FormItem = Form.Item;
const Option = Select.Option;

const AVATAR_SIZE = 256;

class Account extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.accountFormRef = React.createRef();
    this.createCountryNames = memoizeOne(this.createCountryNames);

    this.state = {
      showAvatarDescription: false,
      forbiddenEmails: [],
      forbiddenUsernames: []
    };
  }

  createCountryNames(countryNameProvider, language) {
    return Object.entries(countryNameProvider.getData(language))
      .map(([key, name]) => ({ key, name }))
      .sort(by(x => x.name, { cmp: localeCompare(language) }));
  }

  async saveAccountData({ username, email }) {
    try {
      const { t, userApiClient } = this.props;
      const { result, user } = await userApiClient.saveUserAccount({ username, email });
      switch (result) {
        case SAVE_USER_RESULT.success:
          this.setState(prevState => ({ user: { ...prevState.user, username: user.username, email: user.email } }));
          await message.success(t('account.updateSuccessMessage'));
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          this.setState(prevState => ({ forbiddenEmails: [...prevState.forbiddenEmails, email.toLowerCase()] }));
          this.accountFormRef.current.validateFields(['email'], { force: true });
          break;
        case SAVE_USER_RESULT.duplicateUsername:
          this.setState(prevState => ({ forbiddenUsernames: [...prevState.forbiddenUsernames, username.toLowerCase()] }));
          this.accountFormRef.current.validateFields(['username'], { force: true });
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  async saveProfile(profileToSave) {
    try {
      const { user, userApiClient, t } = this.props;
      const { profile } = await userApiClient.saveUserProfile({ profile: profileToSave });
      user.profile = profile;
      message.success(t('profile.updateSuccessMessage'));
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleBackClick() {
    window.history.back();
  }

  handleAccountFinish({ username, email }) {
    const { t, userApiClient, user } = this.props;

    confirmIdentityWithPassword({
      t,
      username: user.username,
      onOk: () => this.saveAccountData({
        username,
        email
      }),
      userApiClient
    });
  }

  handleProfileFinish(values) {
    this.saveProfile({
      firstName: values.firstName,
      lastName: values.lastName,
      street: values.street,
      streetSupplement: values.streetSupplement,
      postalCode: values.postalCode,
      city: values.city,
      country: values.country
    });
  }

  handleShowAvatarDescriptionClick() {
    this.setState({ showAvatarDescription: true });
  }

  handleAvatarDescriptionAfterClose() {
    this.setState({ showAvatarDescription: false });
  }

  async handleResetPasswordClick() {
    const { t, userApiClient, user } = this.props;

    try {
      await userApiClient.requestPasswordReset({ email: user.email });
      message.success(t('account.passwordResetEmailSent', { email: user.email }));
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  render() {
    const { showAvatarDescription } = this.state;
    const { countryNameProvider, user, language, t } = this.props;
    const profile = user.profile || { country: '' };
    const gravatarUrl = gravatar.url(user.email, { s: AVATAR_SIZE, d: 'mp' });

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

    const gravatarRagistrationUrl = `https://${language}.gravatar.com/`;

    const avatarDescription = (
      <div>
        <Trans
          t={t}
          i18nKey="profile.avatarDescription"
          components={[<a key="gravatar-link" href={gravatarRagistrationUrl} target="_blank" rel="noopener noreferrer" />]}
          />
      </div>
    );

    const accountForm = (
      <Form ref={this.accountFormRef} onFinish={this.handleAccountFinish} scrollToFirstError>
        <FormItem {...tailFormItemLayout}>
          <h2>{t('account.headline')}</h2>
        </FormItem>
        <UsernameInput formItemLayout={formItemLayout} forbiddenUsernames={this.state.forbiddenUsernames} />
        <EmailInput formItemLayout={formItemLayout} forbiddenEmails={this.state.forbiddenEmails} />
        <FormItem {...tailFormItemLayout}>
          <Button type="link" size="small" onClick={this.handleResetPasswordClick}>{t('account.resetPassword')}</Button>
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">{t('common:save')}</Button>
        </FormItem>
      </Form>
    );

    const profileForm = (
      <Form onFinish={this.handleProfileFinish} scrollToFirstError>
        <FormItem {...tailFormItemLayout}>
          <h2>{t('profile.headline')}</h2>
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          <Avatar shape="square" size={AVATAR_SIZE} src={gravatarUrl} alt={user.username} />
          <br />
          <a onClick={this.handleShowAvatarDescriptionClick}>{t('profile.changePicture')}</a>
          <br />
          {showAvatarDescription && (
            <Alert
              message={t('profile.howToChangePicture')}
              description={avatarDescription}
              type="info"
              showIcon
              closable
              afterClose={this.handleAvatarDescriptionAfterClose}
              />
          )}
        </FormItem>
        <FormItem {...formItemLayout} label={t('profile.firstName')} name="firstName" initialValue={profile.firstName || ''}>
          <Input type="text" />
        </FormItem>
        <FormItem {...formItemLayout} label={t('profile.lastName')} name="lastName" initialValue={profile.lastName || ''}>
          <Input type="text" />
        </FormItem>
        <FormItem {...formItemLayout} label={t('profile.street')} name="street" initialValue={profile.street || ''}>
          <Input type="text" />
        </FormItem>
        <FormItem {...formItemLayout} label={t('profile.streetSupplement')} name="streetSupplement" initialValue={profile.streetSupplement || ''}>
          <Input type="text" />
        </FormItem>
        <FormItem {...formItemLayout} label={t('profile.postalCode')} name="postalCode" initialValue={profile.postalCode || ''}>
          <Input type="text" />
        </FormItem>
        <FormItem {...formItemLayout} label={t('profile.city')} name="city" initialValue={profile.city || ''}>
          <Input type="text" />
        </FormItem>
        <FormItem {...formItemLayout} label={t('profile.country')} name="country" initialValue={profile.country || ''}>
          <Select optionFilterProp="title" showSearch allowClear>
            {this.createCountryNames(countryNameProvider, language).map(cn => (
              <Option key={cn.key} value={cn.key} title={cn.name}>
                <CountryFlagAndName code={cn.key} name={cn.name} />
              </Option>
            ))}
          </Select>
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">{t('common:save')}</Button>
        </FormItem>
      </Form>
    );

    const headerActions = [
      {
        handleClick: this.handleBackClick,
        icon: CloseOutlined,
        key: 'close',
        text: t('common:back')
      }
    ];

    return (
      <Page headerActions={headerActions} disableProfileWarning>
        <div className="AccountPage">
          <div className="AccountPage-forms">
            <h1>{t('pageNames:account')}</h1>
            <section>{accountForm}</section>
            <br />
            <br />
            <section>{profileForm}</section>
          </div>
        </div>
      </Page>
    );
  }
}

Account.propTypes = {
  ...userProps,
  ...languageProps,
  ...translationProps,
  countryNameProvider: PropTypes.instanceOf(CountryNameProvider).isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('account')(withLanguage(withUser(inject({
  countryNameProvider: CountryNameProvider,
  userApiClient: UserApiClient
}, Account))));
