import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useUser } from './user-context.js';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import ClientConfig from '../bootstrap/client-config.js';
import RoomApiClient from '../api-clients/room-api-client.js';
import LanguageSelect from './localization/language-select.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import errorHelper, { handleApiError } from '../ui/error-helper.js';
import DocumentApiClient from '../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, ROOM_USER_ROLE } from '../domain/constants.js';
import { Form, Input, Modal, Checkbox, Select, InputNumber, Tooltip, Divider, Empty } from 'antd';
import { documentExtendedMetadataShape, documentMetadataEditShape } from '../ui/default-prop-types.js';
import {
  CLONING_STRATEGY,
  composeTagOptions,
  determineActualTemplateDocumentId,
  determineDocumentRoomId,
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
  const [tagOptions, setTagOptions] = useState(composeTagOptions(initialDocumentMetadata.tags));

  const canReview = hasUserPermission(user, permissions.REVIEW_DOC);
  const canVerify = hasUserPermission(user, permissions.VERIFY_DOC);
  const canRestrictOpenContribution = hasUserPermission(user, permissions.RESTRICT_OPEN_CONTRIBUTION);

  const defaultTemplateDocumentId = settings.templateDocument?.documentId || null;
  const canUseTemplateDocument = mode === DOCUMENT_METADATA_MODAL_MODE.create && !!defaultTemplateDocumentId;
  const canCreateSequences = mode === DOCUMENT_METADATA_MODAL_MODE.create && allowMultiple;

  const initialQualityMetadataValues = mode === DOCUMENT_METADATA_MODAL_MODE.update
    ? {
      review: initialDocumentMetadata.review,
      verified: initialDocumentMetadata.verified,
      allowedOpenContribution: initialDocumentMetadata.allowedOpenContribution
    }
    : {
      review: '',
      verified: false,
      allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent
    };

  const initialValues = {
    title: initialDocumentMetadata.title || t('newDocument'),
    description: initialDocumentMetadata.description || '',
    slug: initialDocumentMetadata.slug || '',
    tags: initialDocumentMetadata.tags || [],
    language: initialDocumentMetadata.language || getDefaultLanguageFromUiLanguage(uiLanguage),
    generateSequence: false,
    sequenceCount: 2,
    useTemplateDocument: false,
    cloningStrategy: CLONING_STRATEGY.cloneWithinArea,
    cloningTargetRoomId: '',
    ...initialQualityMetadataValues
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
      const newTagOptions = composeTagOptions(initialDocumentMetadata.tags, tagSuggestions);
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

  const handleValuesChange = (_, { cloningStrategy, cloningTargetRoomId }) => {
    const documentRoomId = determineDocumentRoomId({ mode, initialDocumentMetadata, documentToClone, cloningStrategy, cloningTargetRoomId });
    const noTargetRoomSelectedYet = cloningStrategy === CLONING_STRATEGY.crossCloneIntoRoom && !cloningTargetRoomId;
    if (documentRoomId || noTargetRoomSelectedYet) {
      formRef.current.setFieldsValue({ allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent });
    }
  };

  const handleFinish = async ({
    title,
    description,
    slug,
    language,
    tags,
    review,
    verified,
    allowedOpenContribution,
    generateSequence,
    sequenceCount,
    useTemplateDocument,
    cloningStrategy,
    cloningTargetRoomId
  }) => {
    try {
      setIsSaving(true);

      const documentRoomId = determineDocumentRoomId({
        mode,
        initialDocumentMetadata,
        documentToClone,
        cloningStrategy,
        cloningTargetRoomId
      });

      const actualTemplateDocumentId = determineActualTemplateDocumentId({
        mode,
        documentToClone,
        useTemplateDocument,
        defaultTemplateDocumentId
      });

      const mappedDocument = {
        title: title.trim(),
        slug: slug.trim(),
        description,
        language,
        tags,
        review,
        verified,
        allowedOpenContribution
      };

      const savedDocuments = [];

      switch (mode) {
        case DOCUMENT_METADATA_MODAL_MODE.clone:
        case DOCUMENT_METADATA_MODAL_MODE.create:
          for (let sequenceIndex = 0; sequenceIndex < (generateSequence ? sequenceCount : 1); sequenceIndex += 1) {
            const documentToSave = { ...cloneDeep(mappedDocument), roomId: documentRoomId };
            if (generateSequence) {
              documentToSave.title = `${mappedDocument.title} (${sequenceIndex + 1})`;
              documentToSave.slug = mappedDocument.slug ? `${mappedDocument.slug}/${sequenceIndex + 1}` : '';
            }
            // eslint-disable-next-line no-await-in-loop
            savedDocuments.push(await documentApiClient.createDocument(documentToSave));
          }
          break;
        case DOCUMENT_METADATA_MODAL_MODE.update:
          savedDocuments.push(await documentApiClient.updateDocumentMetadata({
            documentId: initialDocumentMetadata._id,
            metadata: mappedDocument
          }));
          break;
        default:
          throw new Error(`Invalid document metadata modal mode: '${mode}'`);
      }

      onSave(savedDocuments, actualTemplateDocumentId);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSequenceCountFormInput = generateSequence => {
    if (!generateSequence) {
      return null;
    }
    return (
      <FormItem name="sequenceCount" label={t('sequenceCount')} rules={[{ type: 'integer', min: 2, max: 100 }]}>
        <InputNumber className="DocumentMetadataModal-sequenceInput" min={2} max={100} />
      </FormItem>
    );
  };

  const renderCloningTargetRoomIdFormInput = cloningStrategy => {
    if (cloningStrategy !== CLONING_STRATEGY.crossCloneIntoRoom) {
      return null;
    }

    return (
      <FormItem name="cloningTargetRoomId" label={t('targetRoom')} rules={validationRules.roomValidationRules}>
        <Select
          loading={isLoadingRooms}
          options={cloningOptions.roomOptions}
          notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noAvailableRooms')} />}
          />
      </FormItem>
    );
  };

  const renderAllowedOpenContributionFormItem = (cloningStrategy, cloningTargetRoomId) => {
    const documentRoomId = determineDocumentRoomId({
      mode,
      initialDocumentMetadata,
      documentToClone,
      cloningStrategy,
      cloningTargetRoomId
    });
    const noTargetRoomSelectedYet = cloningStrategy === CLONING_STRATEGY.crossCloneIntoRoom && !cloningTargetRoomId;

    if (documentRoomId || noTargetRoomSelectedYet) {
      return null;
    }

    return (
      <FormItem
        name="allowedOpenContribution"
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
    );
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
      <Form
        ref={formRef}
        layout="vertical"
        name="document-metadata-form"
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
        onFinish={handleFinish}
        >
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
          dependencies={['cloningStrategy']}
          >
          {({ getFieldValue }) => renderCloningTargetRoomIdFormInput(getFieldValue('cloningStrategy'))}
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
        <FormItem name="generateSequence" valuePropName="checked" hidden={!canCreateSequences}>
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
          hidden={!canCreateSequences}
          dependencies={['generateSequence']}
          >
          {({ getFieldValue }) => renderSequenceCountFormInput(getFieldValue('generateSequence'))}
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
          noStyle
          hidden={!canRestrictOpenContribution}
          dependencies={['cloningStrategy', 'cloningTargetRoomId']}
          >
          {({ getFieldValue }) => renderAllowedOpenContributionFormItem(
            getFieldValue('cloningStrategy'),
            getFieldValue('cloningTargetRoomId')
          )}
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
  ]).isRequired,
  isVisible: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(Object.values(DOCUMENT_METADATA_MODAL_MODE)).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

DocumentMetadataModal.defaultProps = {
  allowMultiple: false,
  documentToClone: null
};

export default DocumentMetadataModal;
