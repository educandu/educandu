import moment from 'moment';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { Form, Modal, Input, DatePicker } from 'antd';
import inputValidators from '../utils/input-validators.js';
import React, { useState, useRef, useEffect } from 'react';
import LanguageSelect from './localization/language-select.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import LessonApiClient from '../api-clients/lesson-api-client.js';
import { useDateFormat, useLanguage } from './language-context.js';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

function getDefaultLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}

function LessonCreationModal({ roomId, isVisible, onClose }) {
  const formRef = useRef(null);
  const { dateTimeFormat } = useDateFormat();
  const { language: uiLanguage } = useLanguage();
  const { t } = useTranslation('lessonCreationModal');
  const lessonApiClient = useSessionAwareApiClient(LessonApiClient);

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
    language: getDefaultLanguageFromUiLanguage(uiLanguage)
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

  const handleOnFinish = async ({ title, slug, language, startsOn }) => {
    try {
      setLoading(true);

      const newLesson = await lessonApiClient.addLesson({
        roomId,
        title,
        slug: slug || '',
        language,
        schedule: startsOn ? { startsOn: startsOn.toISOString() } : null
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

  const disabledDate = current => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return current && current <= yesterday;
  };

  const disabledMorningHours = [...Array(7).keys()];
  const disabledEveningHours = [...Array(24).keys()].splice(21);
  const disabledMinutes = [...Array(60).keys()].filter(minute => minute % 5 !== 0);
  const firstEnabledHour = disabledMorningHours[disabledMorningHours.length - 1] + 1;

  const disabledTime = () => {
    return {
      disabledHours: () => [...disabledMorningHours, ...disabledEveningHours],
      disabledMinutes: () => disabledMinutes
    };
  };

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
        <FormItem label={t('startsOn')} name="startsOn">
          <DatePicker
            inputReadOnly
            style={{ width: '100%' }}
            format={dateTimeFormat}
            disabledDate={disabledDate}
            disabledTime={disabledTime}
            showTime={{ defaultValue: moment(`${firstEnabledHour}:00`, 'HH:mm'), format: 'HH:mm', hideDisabledOptions: true }}
            />
        </FormItem>
      </Form>
    </Modal>
  );
}

LessonCreationModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired
};

export default LessonCreationModal;
