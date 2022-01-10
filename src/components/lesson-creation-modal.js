
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Logger from '../common/logger.js';
import { Form, Modal, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { useService } from './container-context.js';
import LessonApiClient from '../api-clients/lesson-api-client.js';
import React, { useState, useRef, useEffect, useCallback } from 'react';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

function LessonCreationModal({ isVisible, onClose }) {
  const formRef = useRef(null);
  const lessonApiClient = useService(LessonApiClient);
  const { t } = useTranslation('lessonCreationModal');

  const lessonTitleValidationRules = [
    {
      required: true,
      message: t('lessonTitleRequired'),
      whitespace: true
    }
  ];

  const isFormValid = async () => {
    try {
      await formRef.current.validateFields(['title'], { force: true });
      return true;
    } catch {
      return false;
    }
  };

  const createLessonState = useCallback(() => ({
    title: t('newLesson'),
    slug: t('slug')
  }), [t]);

  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState(createLessonState());

  useEffect(() => {
    if (isVisible) {
      const newLesson = createLessonState();
      setLesson(newLesson);

      if (formRef.current) {
        formRef.current.setFieldsValue({ title: newLesson.title });
      }
    }
  }, [isVisible, createLessonState]);

  const handleOk = async () => {
    try {
      const isValid = await isFormValid();
      if (!isValid) {
        return;
      }

      setLoading(true);
      const newLesson = await lessonApiClient.addLesson({
        title: lesson.name,
        slug: lesson.access,
        calendar: null
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

  const handleTitleChange = event => {
    const { value } = event.target;
    setLesson(prevState => ({ ...prevState, title: value }));
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
      <Form name="new-lesson-form" ref={formRef} layout="vertical">
        <FormItem label={t('common:title')} name="title" rules={lessonTitleValidationRules} initialValue={lesson.title}>
          <Input onChange={handleTitleChange} />
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
