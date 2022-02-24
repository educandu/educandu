import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import inputValidators from '../utils/input-validators.js';
import { minPasswordLength } from '../domain/validation-constants.js';

const FormItem = Form.Item;

function PasswordFormItem({ name, ...formItemProps }) {
  const { t } = useTranslation('passwordFormItem');

  const passwordValidationRules = [
    {
      required: true,
      message: t('enterPassword'),
      whitespace: true
    },
    {
      validator: (_rule, value) => {
        return value && !inputValidators.isValidPassword(value)
          ? Promise.reject(new Error(t('passwordIsInvalid', { length: minPasswordLength })))
          : Promise.resolve();
      }
    }
  ];

  return (
    <FormItem
      name={name}
      label={t('common:password')}
      rules={passwordValidationRules}
      {...formItemProps}
      >
      <Input type="password" />
    </FormItem>
  );
}

PasswordFormItem.propTypes = {
  name: PropTypes.string.isRequired
};

export default PasswordFormItem;
