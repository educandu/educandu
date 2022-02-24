import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

function PasswordConfirmationFormItem({ name, passwordFormItemName, ...formItemProps }) {
  const { t } = useTranslation('passwordConfirmationFormItem');

  const passwordConfirmationValidationRules = [
    {
      required: true,
      message: t('confirmPassword'),
      whitespace: true
    },
    ({ getFieldValue }) => ({
      validator: (_rule, value) => {
        const otherPassword = getFieldValue(passwordFormItemName);
        return value && value !== otherPassword
          ? Promise.reject(new Error(t('passwordsDoNotMatch')))
          : Promise.resolve();
      }
    })
  ];

  return (
    <FormItem
      name={name}
      label={t('passwordConfirmation')}
      dependencies={[passwordFormItemName]}
      rules={passwordConfirmationValidationRules}
      {...formItemProps}
      >
      <Input type="password" />
    </FormItem>

  );
}

PasswordConfirmationFormItem.propTypes = {
  name: PropTypes.string.isRequired,
  passwordFormItemName: PropTypes.string.isRequired
};

export default PasswordConfirmationFormItem;
