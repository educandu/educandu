import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useUser } from './user-context.js';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import inputValidators from '../utils/input-validators.js';
import LanguageSelect from './localization/language-select.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import errorHelper, { handleApiError } from '../ui/error-helper.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import DocumentApiClient from '../api-clients/document-api-client.js';
import { documentMetadataEditShape } from '../ui/default-prop-types.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { maxDocumentDescriptionLength } from '../domain/validation-constants.js';
import { Form, Input, Modal, Checkbox, Select, InputNumber, Tooltip, Divider } from 'antd';
import { ALLOWED_OPEN_CONTRIBUTION } from '../domain/constants.js';

const FormItem = Form.Item;
const Option = Select.Option;

const logger = new Logger(import.meta.url);

export const DOCUMENT_METADATA_MODAL_MODE = {
  create: 'create',
  update: 'update'
};

function composeTagOptions(initialDocumentTags = [], tagSuggestions = []) {
  const mergedTags = new Set([...initialDocumentTags, ...tagSuggestions]);
  return [...mergedTags].map(tag => ({ key: tag, value: tag }));
}

function getDefaultLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}

function DocumentMetadataModal({
  isVisible,
  mode,
  allowMultiple,
  onSave,
  onClose,
  initialDocumentMetadata,
  templateDocumentId
}) {
  const user = useUser();
  const formRef = useRef(null);
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('documentMetadataModal');
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [loading, setLoading] = useState(false);
  const [tagOptions, setTagOptions] = useState(composeTagOptions(initialDocumentMetadata?.tags));

  const canReview = hasUserPermission(user, permissions.REVIEW_DOC);
  const canVerify = hasUserPermission(user, permissions.VERIFY_DOC);
  const canRestrictOpenContribution = hasUserPermission(user, permissions.RESTRICT_OPEN_CONTRIBUTION);

  const initialValues = {
    title: initialDocumentMetadata.title || t('newDocument'),
    description: initialDocumentMetadata.description || '',
    slug: initialDocumentMetadata.slug || '',
    tags: initialDocumentMetadata.tags || [],
    language: initialDocumentMetadata.language || getDefaultLanguageFromUiLanguage(uiLanguage),
    sequenceCount: 1,
    verified: initialDocumentMetadata.verified,
    allowedOpenContribution: initialDocumentMetadata.allowedOpenContribution
  };

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

  const handleCancel = () => onClose();

  const handleFinish = async ({
    title,
    description,
    slug,
    language,
    tags,
    sequenceCount,
    review,
    allowedOpenContribution,
    verified,
    useTemplateDocument
  }) => {
    try {
      setLoading(true);

      const mappedDocument = {
        title: (title || '').trim(),
        slug: (slug || '').trim(),
        description: (description || '').trim(),
        language,
        tags,
        review: canReview ? (review || '').trim() : initialDocumentMetadata.review,
        verified: !!(canVerify ? verified : initialDocumentMetadata.verified),
        allowedOpenContribution: canRestrictOpenContribution ? allowedOpenContribution : initialDocumentMetadata.allowedOpenContribution
      };

      if (mode === DOCUMENT_METADATA_MODAL_MODE.create) {
        const savedDocuments = [];
        const documentsToSave = sequenceCount > 1
          ? Array.from({ length: sequenceCount }, (_, index) => ({
            ...cloneDeep(mappedDocument),
            roomId: initialDocumentMetadata.roomId,
            title: `${mappedDocument.title} (${index + 1})`,
            slug: mappedDocument.slug ? `${mappedDocument.slug}/${index + 1}` : '',
            tags: mappedDocument.tags,
            review: mappedDocument.review,
            verified: mappedDocument.verified,
            allowedOpenContribution: mappedDocument.allowedOpenContribution
          }))
          : [
            {
              ...cloneDeep(mappedDocument),
              roomId: initialDocumentMetadata.roomId
            }
          ];

        for (const documentToSave of documentsToSave) {
          // eslint-disable-next-line no-await-in-loop
          savedDocuments.push(await documentApiClient.createDocument(documentToSave));
        }

        onSave(savedDocuments, useTemplateDocument ? templateDocumentId : null);
      } else {
        const savedDocument = await documentApiClient.updateDocumentMetadata({ documentId: initialDocumentMetadata._id, metadata: mappedDocument });
        onSave([savedDocument]);
      }
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setLoading(false);
    }
  };

  const allowedOpenContributionOptions = Object.values(ALLOWED_OPEN_CONTRIBUTION)
    .map(optionKey => ({ key: optionKey, value: t(`allowedOpenContribution_${optionKey}`) }));

  return (
    <Modal
      title={mode === DOCUMENT_METADATA_MODAL_MODE.create ? t('newDocument') : t('editDocument')}
      visible={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      okButtonProps={{ loading }}
      okText={t('common:save')}
      >
      <Form onFinish={handleFinish} ref={formRef} name="document-metadata-form" layout="vertical" initialValues={initialValues}>
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
        {mode === DOCUMENT_METADATA_MODAL_MODE.create && allowMultiple && (
          <FormItem
            name="sequenceCount"
            rules={[{ type: 'integer', min: 1, max: 100 }]}
            label={
              <Fragment>
                <span>{t('createSequence')}</span>
                <Tooltip title={t('sequenceInfo')}>
                  <InfoCircleOutlined className="DocumentMetadataModal-infoIcon" />
                </Tooltip>
              </Fragment>
            }
            >
            <InputNumber className="DocumentMetadataModal-sequenceInput" min={1} max={100} />
          </FormItem>
        )}
        {templateDocumentId && (
          <FormItem name="useTemplateDocument" valuePropName="checked">
            <Checkbox>{t('useTemplateDocument')}</Checkbox>
          </FormItem>
        )}
        {(canReview || canVerify) && (
          <Fragment>
            <Divider className="DocumentMetadataModal-divider" />
            {canReview && (
              <FormItem name="review" label={t('review')}>
                <NeverScrollingTextArea />
              </FormItem>
            )}
            {canRestrictOpenContribution && (
              <FormItem
                name="allowedOpenContribution"
                label={
                  <Fragment>
                    {t('allowedOpenContribution')}
                    <Tooltip title={t('allowedOpenContributionInfo')}>
                      <InfoCircleOutlined className="DocumentMetadataModal-infoIcon" />
                    </Tooltip>
                  </Fragment>
                }
                >
                <Select>
                  {allowedOpenContributionOptions.map(option => <Option key={option.key}>{option.value}</Option>)}
                </Select>
              </FormItem>
            )}
            {canVerify && (
              <FormItem name="verified" valuePropName="checked">
                <Checkbox>
                  {t('verified')}
                  <Tooltip title={t('verifiedInfo')}>
                    <InfoCircleOutlined className="DocumentMetadataModal-infoIcon" />
                  </Tooltip>
                </Checkbox>
              </FormItem>
            )}
          </Fragment>
        )}
      </Form>
    </Modal>
  );
}

DocumentMetadataModal.propTypes = {
  allowMultiple: PropTypes.bool,
  initialDocumentMetadata: PropTypes.oneOfType([
    PropTypes.shape({ roomId: PropTypes.string }),
    documentMetadataEditShape
  ]),
  isVisible: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(Object.values(DOCUMENT_METADATA_MODAL_MODE)).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  templateDocumentId: PropTypes.string
};

DocumentMetadataModal.defaultProps = {
  allowMultiple: false,
  initialDocumentMetadata: null,
  templateDocumentId: null
};

export default DocumentMetadataModal;
