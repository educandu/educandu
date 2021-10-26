import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { withUser } from './user-context.js';
import { withTranslation } from 'react-i18next';
import { userProps, translationProps, formItemLayoutShape } from '../ui/default-prop-types.js';

const FormItem = Form.Item;

class EmailInput extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  normalize(email) {
    return email ? email.toLowerCase() : email;
  }

  handleOnChange(event) {
    const element = event.target;
    const caret = element.selectionStart;
    window.requestAnimationFrame(() => {
      element.selectionStart = caret;
      element.selectionEnd = caret;
    });
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
      <FormItem {...formItemLayout} label={t('email')} name="email" initialValue={user?.email || ''} normalize={this.normalize} rules={validationRules}>
        <Input onChange={this.handleOnChange} />
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
