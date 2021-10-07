import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { withUser } from './user-context';
import { withTranslation } from 'react-i18next';
import { userProps, translationProps, formItemLayoutShape } from '../ui/default-prop-types';

const FormItem = Form.Item;

class EmailInput extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  render() {
    const { forbiddenEmails, formItemLayout, user, t } = this.props;

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
      <FormItem {...formItemLayout} label={t('email')} name="email" initialValue={user?.email || ''} rules={validationRules}>
        <Input />
      </FormItem>
    );
  }
}

EmailInput.propTypes = {
  ...userProps,
  ...translationProps,
  forbiddenEmails: PropTypes.array.isRequired,
  formItemLayout: formItemLayoutShape.isRequired
};

export default withTranslation('emailInput')(withUser(EmailInput));
