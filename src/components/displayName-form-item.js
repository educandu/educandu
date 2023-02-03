import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { minUserDisplayNameLength, maxUserDisplayNameLength } from '../domain/validation-constants.js';

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
        return value && value.trim().length < minUserDisplayNameLength
          ? Promise.reject(new Error(t('displayNameIsTooShort', { length: minUserDisplayNameLength })))
          : Promise.resolve();
      }
    }
  ];

  const renderDisplayNameInputCount = ({ count, maxLength }) => {
    return (
      <div className="u-input-count">{`${count} / ${maxLength}`}</div>
    );
  };

  return (
    <FormItem
      name={name}
      label={t('common:displayName')}
      rules={validationRules}
      {...formItemProps}
      >
      <Input maxLength={maxUserDisplayNameLength} showCount={{ formatter: renderDisplayNameInputCount }} />
    </FormItem>
  );
}

DisplayNameFormItem.propTypes = {
  name: PropTypes.string.isRequired
};

export default DisplayNameFormItem;
