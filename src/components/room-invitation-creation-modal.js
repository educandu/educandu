import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { Form, Input, Modal, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import inputValidators from '../utils/input-validators.js';
import React, { Fragment, useEffect, useState } from 'react';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const FormItem = Form.Item;
const { TextArea } = Input;

const logger = new Logger(import.meta.url);

const normalizeEmails = value => value.toLowerCase();
const extractEmails = value => value.match(/[^\s;,]+/g) || [];

function RoomInvitationCreationModal({ isVisible, onOk, onCancel, roomId }) {
  const [form] = Form.useForm();
  const { t } = useTranslation('roomInvitationCreationModal');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  useEffect(() => {
    if (!isVisible) {
      form.resetFields();
    }
  }, [form, isVisible]);

  const initialFormValues = { emails: '' };
  const [isLoading, setIsLoading] = useState(false);

  const emailsValidationRules = [
    {
      validator: (_rule, value) => {
        const emails = extractEmails(value);
        if (!emails.length) {
          return Promise.reject(new Error(t('emailsRequired')));
        }
        if (emails.some(token => !inputValidators.isValidEmail(token))) {
          return Promise.reject(new Error(t('notAllEmailsValid')));
        }
        return Promise.resolve();
      }
    }
  ];

  const handleOnEmailsChange = event => {
    const element = event.target;
    const caret = element.selectionStart;
    window.requestAnimationFrame(() => {
      element.selectionStart = caret;
      element.selectionEnd = caret;
    });
  };

  const handleFormFinish = async values => {
    try {
      setIsLoading(true);
      const emails = extractEmails(values.emails);
      const invitations = await roomApiClient.addRoomInvitations({ emails, roomId });
      onOk(invitations);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalCancel = () => {
    onCancel();
  };

  const handleModalOk = () => {
    form.submit();
  };

  return (
    <Modal
      title={t('sendRoomInvitations')}
      onCancel={handleModalCancel}
      onOk={handleModalOk}
      visible={isVisible}
      okButtonProps={{ loading: isLoading }}
      forceRender
      >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialFormValues}
        onFinish={handleFormFinish}
        >
        <FormItem
          required
          name="emails"
          label={
            <Fragment>
              <Tooltip title={t('emailAddressesInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('emailAddresses')}</span>
            </Fragment>
          }
          rules={emailsValidationRules}
          normalize={normalizeEmails}
          >
          <TextArea onChange={handleOnEmailsChange} autoSize={{ minRows: 3, maxRows: 12 }} />
        </FormItem>
      </Form>
    </Modal>
  );
}

RoomInvitationCreationModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired
};

export default RoomInvitationCreationModal;
