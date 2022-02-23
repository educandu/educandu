import { Form, Input } from 'antd';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import inputValidators from '../utils/input-validators.js';
import { formItemLayoutShape } from '../ui/default-prop-types.js';
import { minPasswordLength } from '../domain/validation-constants.js';

const FormItem = Form.Item;

function PasswordInput({ formItemLayout }) {
  const { t } = useTranslation('passwordInput');

  const passwordValidationRules = [
    {
      required: true,
      message: t('enterPassword')
    },
    {
      validator: (rule, value) => {
        return value && !inputValidators.isValidPassword(value)
          ? Promise.reject(new Error(t('passwordIsInvalid', { length: minPasswordLength })))
          : Promise.resolve();
      }
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

  return (
    <Fragment>
      <FormItem
        {...formItemLayout}
        name="password"
        label={t('common:password')}
        rules={passwordValidationRules}
        >
        <Input type="password" />
      </FormItem>

      <FormItem
        {...formItemLayout}
        name="confirm"
        dependencies={['password']}
        label={t('passwordConfirmation')}
        rules={passwordConfirmationValidationRules}
        >
        <Input type="password" />
      </FormItem>
    </Fragment>
  );
}

PasswordInput.propTypes = {
  formItemLayout: formItemLayoutShape.isRequired
};

export default PasswordInput;
