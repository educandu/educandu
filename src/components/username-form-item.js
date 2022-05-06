import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { minUsernameLength } from '../domain/validation-constants.js';

const FormItem = Form.Item;

function UsernameFormItem({ name, usernamesInUse, ...formItemProps }) {
  const { t } = useTranslation('usernameFormItem');

  const validationRules = [
    {
      required: true,
      message: t('enterUsername'),
      whitespace: true
    },
    {
      validator: (_rule, value) => {
        return value && value.trim().length < minUsernameLength
          ? Promise.reject(new Error(t('usernameIsTooShort', { length: minUsernameLength })))
          : Promise.resolve();
      }
    },
    {
      validator: (_rule, value) => {
        return value && usernamesInUse.includes(value.trim().toLowerCase())
          ? Promise.reject(new Error(t('usernameIsInUse')))
          : Promise.resolve();
      }
    }
  ];

  return (
    <FormItem
      name={name}
      label={t('common:username')}
      rules={validationRules}
      {...formItemProps}
      >
      <Input />
    </FormItem>
  );
}

UsernameFormItem.propTypes = {
  name: PropTypes.string.isRequired,
  usernamesInUse: PropTypes.array
};

UsernameFormItem.defaultProps = {
  usernamesInUse: []
};

export default UsernameFormItem;
