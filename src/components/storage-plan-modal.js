import PropTypes from 'prop-types';
import ByteInput from './byte-input.js';
import React, { useEffect } from 'react';
import { Form, Input, Modal } from 'antd';
import { useIsMounted } from '../ui/hooks.js';
import { useTranslation } from 'react-i18next';
import { storagePlanShape } from '../ui/default-prop-types.js';

const FormItem = Form.Item;

function StoragePlanModal({ isOpen, isLoading, storagePlan, storagePlanNamesInUse, onOk, onCancel }) {
  const [form] = Form.useForm();
  const isMounted = useIsMounted();
  const { t } = useTranslation('storagePlanModal');

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
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, form]);

  const handleOk = () => {
    form.submit();
  };

  const initialValues = {
    _id: storagePlan?._id || '',
    name: storagePlan?.name || t('newStoragePlan'),
    maxBytes: storagePlan?.maxBytes ?? 100 * 1000 * 1000
  };

  return !!isMounted.current && (
    <Modal
      title={storagePlan?._id ? t('editStoragePlan') : t('newStoragePlan')}
      open={isOpen}
      onOk={handleOk}
      onCancel={onCancel}
      maskClosable={false}
      okButtonProps={{ loading: isLoading }}
      forceRender
      >
      <Form form={form} onFinish={onOk} name="storage-plan-form" layout="vertical" initialValues={initialValues} className="u-modal-body">
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
  isOpen: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
  storagePlan: storagePlanShape,
  storagePlanNamesInUse: PropTypes.arrayOf(PropTypes.string)
};

StoragePlanModal.defaultProps = {
  storagePlan: null,
  storagePlanNamesInUse: []
};

export default StoragePlanModal;
