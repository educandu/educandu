import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { withUser } from './user-context';
import { withTranslation } from 'react-i18next';
import { userProps, translationProps, formItemLayoutShape } from '../ui/default-prop-types';

const FormItem = Form.Item;

class UsernameInput extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  render() {
    const { forbiddenUsernames, formItemLayout, user, t } = this.props;

    const validationRules = [
      {
        required: true,
        message: t('enterUsername'),
        whitespace: true
      },
      {
        validator: (rule, value) => {
          const minLength = 6;
          return value && value.trim().length < minLength
            ? Promise.reject(new Error(t('usernameIsTooShort', { length: minLength })))
            : Promise.resolve();
        }
      },
      {
        validator: (rule, value) => {
          return value && forbiddenUsernames.includes(value.toLowerCase())
            ? Promise.reject(new Error(t('usernameIsInUse')))
            : Promise.resolve();
        }
      }
    ];

    return (
      <FormItem {...formItemLayout} label={t('username')} name="username" initialValue={user?.username || ''} rules={validationRules}>
        <Input />
      </FormItem>
    );
  }
}

UsernameInput.propTypes = {
  ...userProps,
  ...translationProps,
  forbiddenUsernames: PropTypes.array.isRequired,
  formItemLayout: formItemLayoutShape.isRequired
};

export default withTranslation('usernameInput')(withUser(UsernameInput));
