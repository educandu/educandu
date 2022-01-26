import React from 'react';
import autoBind from 'auto-bind';
import { Form, Input } from 'antd';
import { withUser } from './user-context.js';
import { withTranslation } from 'react-i18next';
import inputValidators from '../utils/input-validators.js';
import { translationProps, formItemLayoutShape } from '../ui/default-prop-types.js';

const FormItem = Form.Item;

class PasswordInput extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  render() {
    const { formItemLayout, t } = this.props;

    const passwordValidationRules = [
      {
        required: true,
        message: t('enterPassword')
      },
      {
        validator: (rule, value) => {
          const minLength = 8;
          return value && !inputValidators.isValidPassword({ password: value, minLength })
            ? Promise.reject(new Error(t('passwordIsInvalid', { length: minLength })))
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
      <React.Fragment>
        <FormItem {...formItemLayout} label={t('common:password')} name="password" rules={passwordValidationRules}>
          <Input type="password" />
        </FormItem>
        <FormItem {...formItemLayout} label={t('passwordConfirmation')} name="confirm" rules={passwordConfirmationValidationRules} dependencies={['password']}>
          <Input type="password" />
        </FormItem>
      </React.Fragment>
    );
  }
}

PasswordInput.propTypes = {
  ...translationProps,
  formItemLayout: formItemLayoutShape.isRequired
};

export default withTranslation('passwordInput')(withUser(PasswordInput));
