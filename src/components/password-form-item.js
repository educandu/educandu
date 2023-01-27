import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import inputValidators from '../utils/input-validators.js';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { minUserPasswordLength } from '../domain/validation-constants.js';

const FormItem = Form.Item;
const { Password } = Input;

function PasswordFormItem({ name, skipLengthValidation, onPressEnter, ...formItemProps }) {
  const { t } = useTranslation('passwordFormItem');

  const passwordValidationRules = [
    {
      required: true,
      message: t('enterPassword'),
      whitespace: true
    }
  ];

  if (!skipLengthValidation) {
    passwordValidationRules.push({
      validator: (_rule, value) => {
        return value && !inputValidators.isValidPassword(value)
          ? Promise.reject(new Error(t('passwordIsInvalid', { length: minUserPasswordLength })))
          : Promise.resolve();
      }
    });
  }

  const renderIcon = isVisible => isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />;

  return (
    <FormItem
      name={name}
      label={t('common:password')}
      rules={passwordValidationRules}
      {...formItemProps}
      >
      <Password iconRender={renderIcon} onPressEnter={onPressEnter} />
    </FormItem>
  );
}

PasswordFormItem.propTypes = {
  name: PropTypes.string.isRequired,
  skipLengthValidation: PropTypes.bool,
  onPressEnter: PropTypes.func
};

PasswordFormItem.defaultProps = {
  skipLengthValidation: false,
  onPressEnter: () => {}
};

export default PasswordFormItem;
