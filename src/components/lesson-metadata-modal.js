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
import { lessonMetadataShape } from '../ui/default-prop-types.js';
import { useDateFormat, useLanguage } from './language-context.js';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

export const LESSON_MODAL_MODE = {
  create: 'create',
  update: 'update'
};

function getDefaultLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}

function LessonMetadataModal({ lesson, mode, isVisible, onSave, onClose }) {
  const formRef = useRef(null);
  const { dateTimeFormat } = useDateFormat();
  const { language: uiLanguage } = useLanguage();
  const { t } = useTranslation('lessonMetadataModal');
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

  const initialValues = {
    title: lesson.title || t('newLesson'),
    slug: lesson.slug || '',
    language: lesson.language || getDefaultLanguageFromUiLanguage(uiLanguage),
    startsOn: lesson.schedule?.startsOn ? moment(lesson.schedule?.startsOn) : null
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

      const mappedLesson = {
        lessonId: lesson._id,
        roomId: lesson.roomId,
        title,
        slug: slug || '',
        language,
        schedule: startsOn ? { startsOn: startsOn.toISOString() } : null
      };

      const response = mode === LESSON_MODAL_MODE.create
        ? await lessonApiClient.addLesson(mappedLesson)
        : await lessonApiClient.updateLessonMetadata(mappedLesson);

      setLoading(false);
      onSave(response);
      onClose();

      if (mode === LESSON_MODAL_MODE.create) {
        window.location = urls.getLessonUrl(response._id);
      }
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
      title={mode === LESSON_MODAL_MODE.create ? t('newLesson') : t('editLesson')}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      visible={isVisible}
      okButtonProps={{ loading }}
      okText={t('common:save')}
      >
      <Form onFinish={handleOnFinish} name="new-lesson-form" ref={formRef} layout="vertical" initialValues={initialValues}>
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

LessonMetadataModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  lesson: PropTypes.oneOfType([
    PropTypes.shape({ roomId: PropTypes.string.isRequired }),
    lessonMetadataShape
  ]).isRequired,
  mode: PropTypes.oneOf(Object.values(LESSON_MODAL_MODE)).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

LessonMetadataModal.defaultProps = {
  onSave: () => {}
};

export default LessonMetadataModal;
