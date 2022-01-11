import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Logger from '../common/logger.js';
import { Form, Modal, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { useService } from './container-context.js';
import { useLanguage } from './language-context.js';
import inputValidators from '../utils/input-validators.js';
import React, { useState, useRef, useEffect } from 'react';
import LanguageSelect from './localization/language-select.js';
import LessonApiClient from '../api-clients/lesson-api-client.js';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

function getDefaultLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}

function LessonCreationModal({ isVisible, onClose }) {
  const formRef = useRef(null);
  const { language: uiLanguage } = useLanguage();
  const lessonApiClient = useService(LessonApiClient);
  const { t } = useTranslation('lessonCreationModal');

  const [loading, setLoading] = useState(false);

  const titleValidationRules = [
    {
      required: true,
      message: t('titleRequired'),
      whitespace: true
    }
  ];

  const slugValidationRules = [
    {
      validator: (rule, value) => {
        return value && !inputValidators.isValidSlug(value)
          ? Promise.reject(new Error(t('common:invalidSlug')))
          : Promise.resolve();
      }
    }
  ];

  const defaultLesson = {
    title: t('newLesson'),
    slug: '',
    language: getDefaultLanguageFromUiLanguage(uiLanguage),
    scheduling: null
  };

  useEffect(() => {
    if (isVisible && formRef.current) {
      formRef.current.resetFields();
    }
  }, [isVisible]);

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleOnFinish = async ({ title, slug, language }) => {
    try {
      setLoading(true);
      const newLesson = await lessonApiClient.addLesson({
        title,
        slug: slug || '',
        language,
        scheduling: null
      });

      setLoading(false);
      onClose();

      window.location = urls.getLessonUrl(newLesson._id);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      setLoading(false);
    }
  };

  const handleCancel = () => onClose();

  return (
    <Modal
      title={t('newLesson')}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      visible={isVisible}
      okButtonProps={{ loading }}
      >
      <Form onFinish={handleOnFinish} name="new-lesson-form" ref={formRef} layout="vertical" initialValues={defaultLesson}>
        <FormItem label={t('common:title')} name="title" rules={titleValidationRules}>
          <Input />
        </FormItem>
        <FormItem label={t('common:language')} name="language">
          <LanguageSelect />
        </FormItem>
        <FormItem label={t('common:slug')} name="slug" rules={slugValidationRules}>
          <Input />
        </FormItem>
      </Form>
    </Modal>
  );
}

LessonCreationModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default LessonCreationModal;
