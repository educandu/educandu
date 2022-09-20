import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useUser } from './user-context.js';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import { ROOM_USER_ROLE } from '../domain/constants.js';
import ClientConfig from '../bootstrap/client-config.js';
import RoomApiClient from '../api-clients/room-api-client.js';
import LanguageSelect from './localization/language-select.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import errorHelper, { handleApiError } from '../ui/error-helper.js';
import DocumentApiClient from '../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Form, Input, Modal, Checkbox, Select, InputNumber, Tooltip, Divider, Empty } from 'antd';
import { documentExtendedMetadataShape, documentMetadataEditShape } from '../ui/default-prop-types.js';
import {
  CLONING_STRATEGY,
  composeTagOptions,
  determineActualTemplateDocumentId,
  determineTargetRoomId,
  DOCUMENT_METADATA_MODAL_MODE,
  getAllowedOpenContributionOptions,
  getCloningOptions,
  getDefaultLanguageFromUiLanguage,
  getDialogOkButtonText,
  getDialogTitle,
  getValidationRules
} from './document-metadata-modal-utils.js';

const FormItem = Form.Item;
const Option = Select.Option;

const logger = new Logger(import.meta.url);

function DocumentMetadataModal({
  isVisible,
  mode,
  allowMultiple,
  onSave,
  onClose,
  documentToClone,
  initialDocumentMetadata
}) {
  const user = useUser();
  const formRef = useRef(null);
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('documentMetadataModal');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [isSaving, setIsSaving] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [tagOptions, setTagOptions] = useState(composeTagOptions(initialDocumentMetadata?.tags));

  const canReview = hasUserPermission(user, permissions.REVIEW_DOC);
  const canVerify = hasUserPermission(user, permissions.VERIFY_DOC);
  const canRestrictOpenContribution = hasUserPermission(user, permissions.RESTRICT_OPEN_CONTRIBUTION);

  const defaultTemplateDocumentId = settings.templateDocument?.documentId || null;
  const canUseTemplateDocument = mode === DOCUMENT_METADATA_MODAL_MODE.create && !!defaultTemplateDocumentId;
  const canCreateSequenes = mode === DOCUMENT_METADATA_MODAL_MODE.create && allowMultiple;

  const initialValues = {
    title: initialDocumentMetadata.title || t('newDocument'),
    description: initialDocumentMetadata.description || '',
    slug: initialDocumentMetadata.slug || '',
    tags: initialDocumentMetadata.tags || [],
    language: initialDocumentMetadata.language || getDefaultLanguageFromUiLanguage(uiLanguage),
    generateSequence: false,
    sequenceCount: 2,
    review: '',
    verified: initialDocumentMetadata.verified,
    allowedOpenContribution: initialDocumentMetadata.allowedOpenContribution,
    useTemplateDocument: false,
    cloningStrategy: CLONING_STRATEGY.cloneWithinArea,
    cloningTargetRoomId: ''
  };

  const cloningOptions = getCloningOptions({ mode, documentToClone, availableRooms, clientConfig, t });

  const allowedOpenContributionOptions = getAllowedOpenContributionOptions({ t });

  const validationRules = getValidationRules({ t });

  const loadRooms = useCallback(async () => {
    if (mode !== DOCUMENT_METADATA_MODAL_MODE.clone) {
      setAvailableRooms([]);
      setIsLoadingRooms(false);
      return;
    }

    setAvailableRooms([]);
    setIsLoadingRooms(true);
    setAvailableRooms(await roomApiClient.getRooms({ userRole: ROOM_USER_ROLE.ownerOrCollaborator }));
    setIsLoadingRooms(false);
  }, [mode, roomApiClient]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    if (formRef.current) {
      formRef.current.resetFields();
    }
    if (clientConfig.areRoomsEnabled) {
      loadRooms();
    }
  }, [isVisible, clientConfig.areRoomsEnabled, loadRooms]);

  const handleTagSearch = async typedInTag => {
    const sanitizedTypedInTag = (typedInTag || '').trim();
    try {
      if (sanitizedTypedInTag.length < 3) {
        return;
      }
      const tagSuggestions = await documentApiClient.getDocumentTagSuggestions(sanitizedTypedInTag);
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
    generateSequence,
    sequenceCount,
    review,
    allowedOpenContribution,
    verified,
    useTemplateDocument,
    cloningStrategy,
    cloningTargetRoomId
  }) => {
    try {
      setIsSaving(true);

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

      const actualTemplateDocumentId = determineActualTemplateDocumentId({
        mode,
        documentToClone,
        useTemplateDocument,
        defaultTemplateDocumentId
      });

      const targetRoomId = determineTargetRoomId({
        mode,
        initialDocumentMetadata,
        documentToClone,
        cloningStrategy,
        cloningTargetRoomId
      });

      const savedDocuments = [];
      if (mode === DOCUMENT_METADATA_MODAL_MODE.update) {
        savedDocuments.push(await documentApiClient.updateDocumentMetadata({
          documentId: initialDocumentMetadata._id,
          metadata: mappedDocument
        }));
      } else {
        const documentsToSave = Array.from({ length: generateSequence ? sequenceCount : 1 }, (_, index) => {
          const extraProps = generateSequence
            ? { title: `${mappedDocument.title} (${index + 1})`, slug: mappedDocument.slug ? `${mappedDocument.slug}/${index + 1}` : '' }
            : {};

          return {
            ...cloneDeep(mappedDocument),
            ...extraProps,
            roomId: targetRoomId
          };
        });

        for (const documentToSave of documentsToSave) {
          // eslint-disable-next-line no-await-in-loop
          savedDocuments.push(await documentApiClient.createDocument(documentToSave));
        }
      }

      onSave(savedDocuments, actualTemplateDocumentId);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={getDialogTitle(mode, t)}
      visible={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      okButtonProps={{ loading: isSaving }}
      okText={getDialogOkButtonText(mode, t)}
      >
      <Form onFinish={handleFinish} ref={formRef} name="document-metadata-form" layout="vertical" initialValues={initialValues}>
        <FormItem
          name="cloningStrategy"
          label={t('cloningStrategy')}
          hidden={mode !== DOCUMENT_METADATA_MODAL_MODE.clone || cloningOptions.strategyOptions.length <= 1}
          >
          <Select options={cloningOptions.strategyOptions} />
        </FormItem>
        <FormItem
          noStyle
          hidden={mode !== DOCUMENT_METADATA_MODAL_MODE.clone}
          shouldUpdate={(prevValues, currentValues) => prevValues.cloningStrategy !== currentValues.cloningStrategy}
          >
          {({ getFieldValue }) => getFieldValue('cloningStrategy') === CLONING_STRATEGY.crossCloneIntoRoom
            ? (
              <FormItem name="cloningTargetRoomId" label={t('targetRoom')} rules={validationRules.roomValidationRules}>
                <Select
                  loading={isLoadingRooms}
                  options={cloningOptions.roomOptions}
                  notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noAvailableRooms')} />}
                  />
              </FormItem>
            )
            : null}
        </FormItem>
        <FormItem name="title" label={t('common:title')} rules={validationRules.titleValidationRules}>
          <Input />
        </FormItem>
        <FormItem name="description" label={t('common:description')} rules={validationRules.descriptionValidationRules}>
          <NeverScrollingTextArea />
        </FormItem>
        <FormItem name="language" label={t('common:language')}>
          <LanguageSelect />
        </FormItem>
        <FormItem name="slug" label={t('common:slug')} rules={validationRules.slugValidationRules}>
          <Input />
        </FormItem>
        <FormItem name="tags" label={t('common:tags')} rules={validationRules.tagsValidationRules}>
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
        <FormItem name="generateSequence" valuePropName="checked" hidden={!canCreateSequenes}>
          <Checkbox>
            <Fragment>
              <span>{t('generateSequence')}</span>
              <Tooltip title={t('sequenceInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
            </Fragment>
          </Checkbox>
        </FormItem>
        <FormItem
          noStyle
          hidden={!canCreateSequenes}
          shouldUpdate={(prevValues, currentValues) => prevValues.generateSequence !== currentValues.generateSequence}
          >
          {({ getFieldValue }) => getFieldValue('generateSequence')
            ? (
              <FormItem name="sequenceCount" label={t('sequenceCount')} rules={[{ type: 'integer', min: 2, max: 100 }]}>
                <InputNumber className="DocumentMetadataModal-sequenceInput" min={2} max={100} />
              </FormItem>
            )
            : null}
        </FormItem>
        <FormItem name="useTemplateDocument" valuePropName="checked" hidden={!canUseTemplateDocument}>
          <Checkbox>{t('useTemplateDocument')}</Checkbox>
        </FormItem>
        {(canReview || canVerify) && (
          <Divider className="DocumentMetadataModal-divider" />
        )}
        <FormItem name="review" label={t('review')} hidden={!canReview}>
          <NeverScrollingTextArea />
        </FormItem>
        <FormItem
          name="allowedOpenContribution"
          hidden={!canRestrictOpenContribution}
          label={
            <Fragment>
              {t('allowedOpenContribution')}
              <Tooltip title={t('allowedOpenContributionInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
            </Fragment>
          }
          >
          <Select>
            {allowedOpenContributionOptions.map(option => <Option key={option.key}>{option.value}</Option>)}
          </Select>
        </FormItem>
        <FormItem name="verified" valuePropName="checked" hidden={!canVerify}>
          <Checkbox>
            {t('verified')}
            <Tooltip title={t('verifiedInfo')}>
              <InfoCircleOutlined className="u-info-icon" />
            </Tooltip>
          </Checkbox>
        </FormItem>
      </Form>
    </Modal>
  );
}

DocumentMetadataModal.propTypes = {
  allowMultiple: PropTypes.bool,
  documentToClone: documentExtendedMetadataShape,
  initialDocumentMetadata: PropTypes.oneOfType([
    PropTypes.shape({ roomId: PropTypes.string }),
    documentMetadataEditShape
  ]),
  isVisible: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(Object.values(DOCUMENT_METADATA_MODAL_MODE)).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

DocumentMetadataModal.defaultProps = {
  allowMultiple: false,
  documentToClone: null,
  initialDocumentMetadata: null
};

export default DocumentMetadataModal;
