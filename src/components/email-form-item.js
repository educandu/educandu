import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

const normalizeEmail = value => value?.toLowerCase();

function EmailFormItem({ name, emailsInUse, ...formItemProps }) {
  const { t } = useTranslation('emailFormItem');

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
      message: t('enterEmail'),
      whitespace: true
    },
    {
      type: 'email',
      message: t('emailIsInvalid')
    },
    {
      validator: (_rule, value) => {
        return value && emailsInUse.includes(normalizeEmail(value))
          ? Promise.reject(new Error(t('emailIsInUse')))
          : Promise.resolve();
      }
    }
  ];

  return (
    <FormItem
      name={name}
      label={t('common:emailAddress')}
      rules={validationRules}
      normalize={normalizeEmail}
      {...formItemProps}
      >
      <Input onChange={handleOnChange} />
    </FormItem>
  );
}

EmailFormItem.propTypes = {
  emailsInUse: PropTypes.array,
  name: PropTypes.string.isRequired
};

EmailFormItem.defaultProps = {
  emailsInUse: []
};

export default EmailFormItem;
