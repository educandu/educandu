import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { formItemLayoutShape } from '../ui/default-prop-types.js';

const FormItem = Form.Item;

function UsernameInput({ forbiddenUsernames, formItemLayout }) {
  const user = useUser();
  const { t } = useTranslation('usernameInput');

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
    <FormItem
      {...formItemLayout}
      name="username"
      label={t('username')}
      rules={validationRules}
      initialValue={user?.username || ''}
      >
      <Input />
    </FormItem>
  );
}

UsernameInput.propTypes = {
  forbiddenUsernames: PropTypes.array.isRequired,
  formItemLayout: formItemLayoutShape.isRequired
};

export default UsernameInput;
