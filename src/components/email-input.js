import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { formItemLayoutShape } from '../ui/default-prop-types.js';

const FormItem = Form.Item;

function EmailInput({ forbiddenEmails, formItemLayout }) {
  const user = useUser();
  const { t } = useTranslation('emailInput');

  const normalize = email => {
    return email ? email.toLowerCase() : email;
  };

  const handleOnChange = event => {
    const element = event.target;
    const caret = element.selectionStart;
    window.requestAnimationFrame(() => {
      element.selectionStart = caret;
      element.selectionEnd = caret;
    });
  };

  const validationRules = [
    {
      required: true,
      message: t('enterEmail')
    },
    {
      type: 'email',
      message: t('emailIsInvalid')
    },
    {
      validator: (rule, value) => {
        return value && forbiddenEmails.includes(value.toLowerCase())
          ? Promise.reject(new Error(t('emailIsInUse')))
          : Promise.resolve();
      }
    }
  ];

  return (
    <FormItem
      {...formItemLayout}
      label={t('email')}
      name="email"
      initialValue={user?.email || ''}
      normalize={normalize}
      rules={validationRules}
      >
      <Input onChange={handleOnChange} />
    </FormItem>
  );
}

EmailInput.propTypes = {
  forbiddenEmails: PropTypes.array.isRequired,
  formItemLayout: formItemLayoutShape.isRequired
};

export default EmailInput;
