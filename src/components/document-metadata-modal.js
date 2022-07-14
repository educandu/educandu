import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import inputValidators from '../utils/input-validators.js';
import React, { useEffect, useRef, useState } from 'react';
import { Form, Input, Modal, Checkbox, Select } from 'antd';
import LanguageSelect from './localization/language-select.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import errorHelper, { handleApiError } from '../ui/error-helper.js';
import DocumentApiClient from '../api-clients/document-api-client.js';
import { documentMetadataEditShape } from '../ui/default-prop-types.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { maxDocumentDescriptionLength } from '../domain/validation-constants.js';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

export const DOCUMENT_METADATA_MODAL_MODE = {
  create: 'create',
  update: 'update'
};

function composeTagOptions(initialDocumentTags = [], tagSuggestions = []) {
  const mergedTags = new Set([...initialDocumentTags, ...tagSuggestions]);
  return [...mergedTags].map(tag => ({ key: tag, value: tag }));
}

function DocumentMetadataModal({ isVisible, mode, onSave, onClose, initialDocumentMetadata, templateDocumentId }) {
  const user = useUser();
  const formRef = useRef(null);
  const { t } = useTranslation('documentMetadataModal');
  const documentApiClient = useService(DocumentApiClient);

  const [loading, setLoading] = useState(false);

  const [tagOptions, setTagOptions] = useState(composeTagOptions(initialDocumentMetadata?.tags));

  const titleValidationRules = [
    {
      required: true,
      message: t('titleRequired'),
      whitespace: true
    }
  ];

  const descriptionValidationRules = [
    {
      max: maxDocumentDescriptionLength,
      message: t('descriptionTooLong', { maxChars: maxDocumentDescriptionLength })
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

  const tagsValidationRules = [
    {
      validator: (rule, value) => {
        return value.length && value.some(tag => !inputValidators.isValidTag({ tag }))
          ? Promise.reject(new Error(t('common:invalidSlug')))
          : Promise.resolve();
      }
    }
  ];

  useEffect(() => {
    if (isVisible && formRef.current) {
      formRef.current.resetFields();
    }
  }, [isVisible]);

  const handleTagSearch = async typedInTag => {
    try {
      if (typedInTag.length < 3) {
        return;
      }
      const tagSuggestions = await documentApiClient.getDocumentTagSuggestions(typedInTag);
      const newTagOptions = composeTagOptions(initialDocumentMetadata?.tags, tagSuggestions);
      setTagOptions(newTagOptions);
    } catch (error) {
      handleApiError({ error, t });
    }
  };

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleOnFinish = async ({ title, description, slug, language, tags, review, useTemplateDocument }) => {
    try {
      setLoading(true);

      await onSave({
        title: (title || '').trim(),
        slug: (slug || '').trim(),
        description: (description || '').trim(),
        language,
        tags,
        review: hasUserPermission(user, permissions.REVIEW_DOC) ? (review || '').trim() : initialDocumentMetadata.review,
        templateDocumentId: useTemplateDocument ? templateDocumentId : null
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleCancel = () => onClose();

  return (
    <Modal
      title={mode === DOCUMENT_METADATA_MODAL_MODE.create ? t('newDocument') : t('editDocument')}
      visible={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      okButtonProps={{ loading }}
      >
      <Form onFinish={handleOnFinish} ref={formRef} name="document-metadata-form" layout="vertical" initialValues={initialDocumentMetadata}>
        <FormItem name="title" label={t('common:title')} rules={titleValidationRules}>
          <Input />
        </FormItem>
        <FormItem name="description" label={t('common:description')} rules={descriptionValidationRules}>
          <NeverScrollingTextArea />
        </FormItem>
        <FormItem name="language" label={t('common:language')}>
          <LanguageSelect />
        </FormItem>
        <FormItem name="slug" label={t('common:slug')} rules={slugValidationRules}>
          <Input />
        </FormItem>
        <FormItem name="tags" label={t('common:tags')} rules={tagsValidationRules}>
          <Select
            mode="tags"
            tokenSeparators={[' ', '\t']}
            onSearch={handleTagSearch}
            notFoundContent={null}
            options={tagOptions}
            autoComplete="none"
            placeholder={t('tagsPlaceholder')}
            />
        </FormItem>
        {templateDocumentId && (
          <FormItem name="useTemplateDocument" valuePropName="checked">
            <Checkbox>{t('useTemplateDocument')}</Checkbox>
          </FormItem>
        )}
        {hasUserPermission(user, permissions.REVIEW_DOC) && (
          <FormItem name="review" label={t('review')}>
            <NeverScrollingTextArea />
          </FormItem>
        )}
      </Form>
    </Modal>
  );
}

DocumentMetadataModal.propTypes = {
  initialDocumentMetadata: documentMetadataEditShape,
  isVisible: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(Object.values(DOCUMENT_METADATA_MODAL_MODE)).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  templateDocumentId: PropTypes.string
};

DocumentMetadataModal.defaultProps = {
  initialDocumentMetadata: null,
  templateDocumentId: null
};

export default DocumentMetadataModal;
