import PropTypes from 'prop-types';
import ByteInput from './byte-input.js';
import { Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { baseStoragePlanShape } from '../ui/default-prop-types.js';

const FormItem = Form.Item;

function StoragePlanModal({ isVisible, storagePlan, storagePlanNamesInUse, onOk, onCancel }) {
  const [form] = Form.useForm();
  const { t } = useTranslation('storagePlanModal');
  const [loading, setLoading] = useState(false);

  const nameValidationRules = [
    {
      required: true,
      message: t('nameRequired'),
      whitespace: true
    },
    {
      validator: (_rule, value) => {
        return value && storagePlanNamesInUse.includes(value)
          ? Promise.reject(new Error(t('storagePlanNameIsInUse')))
          : Promise.resolve();
      }
    }
  ];

  const maxBytesValidationRules = [
    {
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      type: 'number',
      message: t('numberTooSmallOrTooBig')
    }
  ];

  useEffect(() => {
    if (isVisible) {
      form.resetFields();
    }
  }, [isVisible, form]);

  const handleOk = () => {
    form.submit();
  };

  const handleOnFinish = async ({ _id, name, maxBytes }) => {
    try {
      setLoading(true);
      await onOk({ _id, name, maxBytes });
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const initialValues = {
    _id: storagePlan?._id || '',
    name: storagePlan?.name || t('newStoragePlan'),
    maxBytes: storagePlan?.maxBytes ?? 100 * 1000 * 1000
  };

  return (
    <Modal
      title={storagePlan?._id ? t('editStoragePlan') : t('newStoragePlan')}
      visible={isVisible}
      onOk={handleOk}
      onCancel={onCancel}
      maskClosable={false}
      okButtonProps={{ loading }}
      >
      <Form form={form} onFinish={handleOnFinish} name="storage-plan-form" layout="vertical" initialValues={initialValues}>
        <FormItem name="_id" hidden>
          <Input />
        </FormItem>
        <FormItem name="name" label={t('common:name')} rules={nameValidationRules}>
          <Input />
        </FormItem>
        <FormItem name="maxBytes" label={t('common:capacity')} rules={maxBytesValidationRules}>
          <ByteInput />
        </FormItem>
      </Form>
    </Modal>
  );
}

StoragePlanModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
  storagePlan: baseStoragePlanShape,
  storagePlanNamesInUse: PropTypes.arrayOf(PropTypes.string)
};

StoragePlanModal.defaultProps = {
  storagePlan: null,
  storagePlanNamesInUse: []
};

export default StoragePlanModal;
