import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { minDisplayNameLength, maxDisplayNameLength } from '../domain/validation-constants.js';

const FormItem = Form.Item;

function DisplayNameFormItem({ name, ...formItemProps }) {
  const { t } = useTranslation('displayNameFormItem');

  const validationRules = [
    {
      required: true,
      message: t('enterDisplayName'),
      whitespace: true
    },
    {
      validator: (_rule, value) => {
        return value && value.trim().length < minDisplayNameLength
          ? Promise.reject(new Error(t('displayNameIsTooShort', { length: minDisplayNameLength })))
          : Promise.resolve();
      }
    },
    {
      validator: (_rule, value) => {
        return value && value.trim().length > maxDisplayNameLength
          ? Promise.reject(new Error(t('displayNameIsTooLong', { length: maxDisplayNameLength })))
          : Promise.resolve();
      }
    }
  ];

  return (
    <FormItem
      name={name}
      label={t('common:displayName')}
      rules={validationRules}
      {...formItemProps}
      >
      <Input />
    </FormItem>
  );
}

DisplayNameFormItem.propTypes = {
  name: PropTypes.string.isRequired
};

export default DisplayNameFormItem;
