import moment from 'moment';
import Alert from './alert.js';
import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useUser } from './user-context.js';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import inputValidators from '../utils/input-validators.js';
import LanguageSelect from './localization/language-select.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { useDateFormat, useLocale } from './locale-context.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import errorHelper, { handleApiError } from '../ui/error-helper.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DocumentApiClient from '../api-clients/document-api-client.js';
import { documentMetadataEditShape } from '../ui/default-prop-types.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { maxDocumentDescriptionLength } from '../domain/validation-constants.js';
import { Form, Input, Modal, Checkbox, Select, DatePicker, Collapse, InputNumber } from 'antd';

const FormItem = Form.Item;
const CollapsePanel = Collapse.Panel;

const logger = new Logger(import.meta.url);

export const DOCUMENT_METADATA_MODAL_MODE = {
  create: 'create',
  update: 'update'
};

const DOCUMENT_SEQUENCE_INTERVAL = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  yearly: 'yearly'
};

const MOMENT_INTERVAL_UNITS = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
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
  const { dateTimeFormat } = useDateFormat();
  const { t } = useTranslation('documentMetadataModal');
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [loading, setLoading] = useState(false);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [isSequenceExpanded, setIsSequenceExpanded] = useState(false);
  const [tagOptions, setTagOptions] = useState(composeTagOptions(initialDocumentMetadata?.tags));

  const initialValues = {
    title: initialDocumentMetadata.title || t('newDocument'),
    slug: initialDocumentMetadata.slug || '',
    tags: initialDocumentMetadata.tags || [],
    language: initialDocumentMetadata.language || getDefaultLanguageFromUiLanguage(uiLanguage),
    dueOn: initialDocumentMetadata.dueOn ? moment(initialDocumentMetadata.dueOn) : '',
    enableSequence: false,
    sequenceInterval: DOCUMENT_SEQUENCE_INTERVAL.weekly,
    sequenceCount: 3
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
      setHasDueDate(false);
      setIsSequenceExpanded(false);
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

  const handleValuesChange = (_, { dueOn }) => {
    setHasDueDate(!!dueOn);
  };

  const handleFinish = async ({
    title,
    description,
    slug,
    language,
    tags,
    dueOn,
    enableSequence,
    sequenceInterval,
    sequenceCount,
    review,
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
        dueOn: dueOn ? dueOn.toISOString() : '',
        review: hasUserPermission(user, permissions.REVIEW_DOC) ? (review || '').trim() : initialDocumentMetadata.review
      };

      if (mode === DOCUMENT_METADATA_MODAL_MODE.create) {
        const savedDocuments = [];
        const documentsToSave = enableSequence && sequenceCount > 1 && dueOn
          ? Array.from({ length: sequenceCount }, (_, index) => ({
            ...cloneDeep(mappedDocument),
            roomId: initialDocumentMetadata.roomId,
            title: `${mappedDocument.title} (${index + 1})`,
            slug: mappedDocument.slug ? `${mappedDocument.slug}/${index + 1}` : '',
            tags: mappedDocument.tags,
            dueOn: moment(dueOn).add(index, MOMENT_INTERVAL_UNITS[sequenceInterval]).toISOString(),
            review: mappedDocument.review
          }))
          : [mappedDocument];

        for (const documentToSave of documentsToSave) {
          // eslint-disable-next-line no-await-in-loop
          savedDocuments.push(await documentApiClient.createDocument(documentToSave));
        }

        onSave(allowMultiple ? savedDocuments : savedDocuments[0], useTemplateDocument ? templateDocumentId : null);
      } else {
        const savedDocument = await documentApiClient.updateDocumentMetadata({ documentId: initialDocumentMetadata._id, metadata: mappedDocument });
        onSave(savedDocument);
      }
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setLoading(false);
    }
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

  const handleSequenceCollapseChange = ([value]) => {
    setIsSequenceExpanded(value === 'sequence');
    formRef.current?.setFieldsValue({ enableSequence: value === 'sequence' });
  };

  const documentSequenceIntervalOptions = useMemo(() => {
    return Object.values(DOCUMENT_SEQUENCE_INTERVAL).map(value => ({ value, label: t(`common:${value}`) }));
  }, [t]);

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
      <Form onFinish={handleFinish} ref={formRef} onValuesChange={handleValuesChange} name="document-metadata-form" layout="vertical" initialValues={initialValues}>
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
        {initialDocumentMetadata?.roomId && (
          <FormItem label={t('dueOn')} name="dueOn">
            <DatePicker
              inputReadOnly
              style={{ width: '100%' }}
              format={dateTimeFormat}
              disabledTime={disabledTime}
              showTime={{ defaultValue: moment(`${firstEnabledHour}:00`, 'HH:mm'), format: 'HH:mm', hideDisabledOptions: true }}
              />
          </FormItem>
        )}
        <FormItem name="enableSequence" valuePropName="checked" hidden>
          <Checkbox />
        </FormItem>
        {mode === DOCUMENT_METADATA_MODAL_MODE.create && allowMultiple && (
          <Collapse className="DocumentMetadataModal-sequenceCollapse" activeKey={isSequenceExpanded ? ['sequence'] : []} onChange={handleSequenceCollapseChange} ghost>
            <CollapsePanel header={t('createSequence')} key="sequence" forceRender>
              <Alert className="DocumentMetadataModal-sequenceInfo" message={t('sequenceInfoBoxHeader')} description={t('sequenceInfoBoxDescription')} />
              <FormItem label={t('sequenceInterval')} name="sequenceInterval">
                <Select options={documentSequenceIntervalOptions} disabled={!hasDueDate} />
              </FormItem>
              <FormItem label={t('sequenceCount')} name="sequenceCount" rules={[{ type: 'integer', min: 1, max: 100 }]}>
                <InputNumber style={{ width: '100%' }} disabled={!hasDueDate} min={1} max={100} />
              </FormItem>
            </CollapsePanel>
          </Collapse>
        )}
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
  allowMultiple: PropTypes.bool,
  initialDocumentMetadata: PropTypes.oneOfType([
    PropTypes.shape({ roomId: PropTypes.string.isRequired }),
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
