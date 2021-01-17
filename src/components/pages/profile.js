import by from 'thenby';
import React from 'react';
import Page from '../page';
import gravatar from 'gravatar';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import Logger from '../../common/logger';
import { withUser } from '../user-context';
import localeCompare from 'locale-compare';
import { inject } from '../container-context';
import errorHelper from '../../ui/error-helper';
import { CloseOutlined } from '@ant-design/icons';
import { withLanguage } from '../language-context';
import { Trans, withTranslation } from 'react-i18next';
import UserApiClient from '../../services/user-api-client';
import CountryNameProvider from '../../data/country-name-provider';
import CountryFlagAndName from '../localization/country-flag-and-name';
import { Form, Input, Alert, Avatar, Button, Select, message } from 'antd';
import { userProps, languageProps, translationProps } from '../../ui/default-prop-types';

const logger = new Logger(__filename);

const FormItem = Form.Item;
const Option = Select.Option;

const AVATAR_SIZE = 256;

class Profile extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.createCountryNames = memoizeOne(this.createCountryNames);

    this.state = {
      showAvatarDescription: false
    };
  }

  createCountryNames(countryNameProvider, language) {
    return Object.entries(countryNameProvider.getData(language))
      .map(([key, name]) => ({ key, name }))
      .sort(by(x => x.name, { cmp: localeCompare(language) }));
  }

  async saveProfile(profileToSave) {
    try {
      const { user, userApiClient, t } = this.props;
      const { profile } = await userApiClient.saveUserProfile({ profile: profileToSave });
      user.profile = profile;
      message.success(t('updateSuccessMessage'));
    } catch (error) {
      errorHelper.handleApiError(error, logger);
    }
  }

  handleBackClick() {
    window.history.back();
  }

  handleFinish(values) {
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
          i18nKey="avatarDescription"
          components={[<a key="gravatar-link" href={gravatarRagistrationUrl} target="_blank" rel="noopener noreferrer" />]}
          />
      </div>
    );

    const profileForm = (
      <div className="ProfilePage-form">
        <Form onFinish={this.handleFinish} scrollToFirstError>
          <FormItem {...tailFormItemLayout}>
            <h1>{t('pageNames:profile')}</h1>
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Avatar shape="square" size={AVATAR_SIZE} src={gravatarUrl} alt={user.username} />
            <br />
            <a onClick={this.handleShowAvatarDescriptionClick}>{t('changeProfilePicture')}</a>
            <br />
            {showAvatarDescription && (
              <Alert
                message={t('howToChangeProfilePicture')}
                description={avatarDescription}
                type="info"
                showIcon
                closable
                afterClose={this.handleAvatarDescriptionAfterClose}
                />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label={t('firstName')} name="firstName" initialValue={profile.firstName || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label={t('lastName')} name="lastName" initialValue={profile.lastName || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label={t('street')} name="street" initialValue={profile.street || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label={t('streetSupplement')} name="streetSupplement" initialValue={profile.streetSupplement || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label={t('postalCode')} name="postalCode" initialValue={profile.postalCode || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label={t('city')} name="city" initialValue={profile.city || ''}>
            <Input type="text" />
          </FormItem>
          <FormItem {...formItemLayout} label={t('country')} name="country" initialValue={profile.country || ''}>
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
      </div>
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
        <div className="ProfilePage">
          {profileForm}
        </div>
      </Page>
    );
  }
}

Profile.propTypes = {
  ...userProps,
  ...languageProps,
  ...translationProps,
  countryNameProvider: PropTypes.instanceOf(CountryNameProvider).isRequired,
  userApiClient: PropTypes.instanceOf(UserApiClient).isRequired
};

export default withTranslation('profile')(withLanguage(withUser(inject({
  countryNameProvider: CountryNameProvider,
  userApiClient: UserApiClient
}, Profile))));
