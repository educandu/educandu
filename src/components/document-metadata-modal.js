/* eslint-disable complexity */
import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useUser } from './user-context.js';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { useSettings } from './settings-context.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import RoomApiClient from '../api-clients/room-api-client.js';
import LanguageSelect from './localization/language-select.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import errorHelper, { handleApiError } from '../ui/error-helper.js';
import DocumentApiClient from '../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, ROOM_USER_ROLE } from '../domain/constants.js';
import { Form, Input, Modal, Checkbox, Select, InputNumber, Tooltip, Empty, Collapse } from 'antd';
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
const CollapsePanel = Collapse.Panel;

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
  const { t } = useTranslation('documentMetadataModal');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [isSaving, setIsSaving] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [tagOptions, setTagOptions] = useState(composeTagOptions(initialDocumentMetadata.tags));

  const [title, setTitle] = useState(initialDocumentMetadata.title || t('newDocument'));
  const [description, setDescription] = useState(initialDocumentMetadata.description || '');
  const [slug, setSlug] = useState(initialDocumentMetadata.slug || '');
  const [tags, setTags] = useState(initialDocumentMetadata.tags || []);
  const [language, setLanguage] = useState(initialDocumentMetadata.language || getDefaultLanguageFromUiLanguage(uiLanguage));
  const [publicContext, setPublicContext] = useState(initialDocumentMetadata.publicContext
    || {
      archived: false,
      verified: false,
      review: '',
      allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent
    });

  const [generateSequence, setGenerateSequence] = useState(false);
  const [sequenceCount, setSequenceCount] = useState(2);
  const [useTemplateDocument, setUseTemplateDocument] = useState(false);
  const [cloningStrategy, setCloningStrategy] = useState(CLONING_STRATEGY.cloneWithinArea);
  const [cloningTargetRoomId, setCloningTargetRoomId] = useState('');
  const documentRoomId = useMemo(() => determineDocumentRoomId({
    mode,
    initialDocumentMetadata,
    documentToClone,
    cloningStrategy,
    cloningTargetRoomId
  }), [mode, initialDocumentMetadata, documentToClone, cloningStrategy, cloningTargetRoomId]);

  const publicContextPermissions = {
    canArchive: hasUserPermission(user, permissions.MANAGE_ARCHIVED_DOCS),
    canVerify: hasUserPermission(user, permissions.VERIFY_DOC),
    canReview: hasUserPermission(user, permissions.REVIEW_DOC),
    canRestrictOpenContribution: hasUserPermission(user, permissions.RESTRICT_OPEN_CONTRIBUTION)
  };
  const hasPublicContextPermissions = Object.values(publicContextPermissions).some(value => value);

  const cloningOptions = getCloningOptions({ mode, documentToClone, availableRooms, t });
  const allowedOpenContributionOptions = getAllowedOpenContributionOptions({ t });

  const defaultTemplateDocumentId = settings.templateDocument?.documentId || null;
  const canUseTemplateDocument = mode === DOCUMENT_METADATA_MODAL_MODE.create && !!defaultTemplateDocumentId;
  const canCreateSequence = mode === DOCUMENT_METADATA_MODAL_MODE.create && allowMultiple;
  const canSelectCloningStrategy = mode === DOCUMENT_METADATA_MODAL_MODE.clone && cloningOptions.strategyOptions.length > 1;

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
    loadRooms();
  }, [isVisible, loadRooms]);

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

  const handleCloningStrategyChange = value => {
    setCloningStrategy(value);
  };

  const handleCloningTargetRoomIdChange = value => {
    setCloningTargetRoomId(value);
  };

  const handleTitleChange = event => {
    const { value } = event.target;
    setTitle(value);
  };

  const handleDescriptionChange = event => {
    const { value } = event.target;
    setDescription(value);
  };

  const handleLanguageChange = value => {
    setLanguage(value);
  };

  const handleSlugChange = event => {
    const { value } = event.target;
    setSlug(value);
  };

  const handleTagsChange = value => {
    setTags(value);
  };

  const handleGenerateSequenceChange = event => {
    const { checked } = event.target;
    setGenerateSequence(checked);
  };

  const handleSequenceCountChange = value => {
    setSequenceCount(value);
  };

  const handleUseTemplateDocumentChange = event => {
    const { checked } = event.target;
    setUseTemplateDocument(checked);
  };

  const handleArchivedChange = event => {
    const { checked } = event.target;
    setPublicContext(prevState => ({ ...prevState, archived: checked }));
  };

  const handleVerifiedChange = event => {
    const { checked } = event.target;
    setPublicContext(prevState => ({ ...prevState, verified: checked }));
  };

  const handleReviewChange = event => {
    const { value } = event.target;
    setPublicContext(prevState => ({ ...prevState, review: value }));
  };

  const handleAllowedOpenContributionChange = value => {
    setPublicContext(prevState => ({ ...prevState, allowedOpenContribution: value }));
  };

  const handleFinish = async () => {
    try {
      setIsSaving(true);

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
        publicContext: documentRoomId ? null : publicContext
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
      <Form ref={formRef} layout="vertical" onFinish={handleFinish} >
        {canSelectCloningStrategy && (
          <FormItem label={t('cloningStrategy')} >
            <Select value={cloningStrategy} options={cloningOptions.strategyOptions} onChange={handleCloningStrategyChange} />
          </FormItem>
        )}
        {canSelectCloningStrategy && cloningStrategy === CLONING_STRATEGY.crossCloneIntoRoom && (
          <FormItem label={t('targetRoom')} rules={validationRules.roomValidationRules}>
            <Select
              value={cloningTargetRoomId}
              loading={isLoadingRooms}
              onChange={handleCloningTargetRoomIdChange}
              options={cloningOptions.roomOptions}
              notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noAvailableRooms')} />}
              />
          </FormItem>
        )}
        <FormItem label={t('common:title')} rules={validationRules.titleValidationRules}>
          <Input value={title} onChange={handleTitleChange} />
        </FormItem>
        <FormItem label={t('common:description')} rules={validationRules.descriptionValidationRules}>
          <NeverScrollingTextArea value={description} onChange={handleDescriptionChange} />
        </FormItem>
        <FormItem label={t('common:language')}>
          <LanguageSelect value={language} onChange={handleLanguageChange} />
        </FormItem>
        <FormItem label={t('common:slug')} rules={validationRules.slugValidationRules}>
          <Input value={slug} onChange={handleSlugChange} />
        </FormItem>
        <FormItem label={t('common:tags')} rules={validationRules.tagsValidationRules}>
          <Select
            mode="tags"
            value={tags}
            autoComplete="none"
            options={tagOptions}
            notFoundContent={null}
            onSearch={handleTagSearch}
            onChange={handleTagsChange}
            tokenSeparators={[' ', '\t']}
            placeholder={t('tagsPlaceholder')}
            />
        </FormItem>
        {canCreateSequence && (
          <FormItem>
            <Checkbox checked={generateSequence} onChange={handleGenerateSequenceChange}>
              <Fragment>
                <span className="u-label">{t('generateSequence')}</span>
                <Tooltip title={t('sequenceInfo')}>
                  <InfoCircleOutlined className="u-info-icon" />
                </Tooltip>
              </Fragment>
            </Checkbox>
          </FormItem>
        )}
        {canCreateSequence && generateSequence && (
          <FormItem label={t('sequenceCount')} rules={[{ type: 'integer', min: 2, max: 100 }]}>
            <InputNumber value={sequenceCount} onChange={handleSequenceCountChange} className="DocumentMetadataModal-sequenceInput" min={2} max={100} />
          </FormItem>
        )}
        {canUseTemplateDocument && (
          <FormItem>
            <Checkbox checked={useTemplateDocument} onChange={handleUseTemplateDocumentChange}>
              <span className="u-label">{t('useTemplateDocument')}</span>
            </Checkbox>
          </FormItem>
        )}
        {!documentRoomId && cloningStrategy !== CLONING_STRATEGY.crossCloneIntoRoom && hasPublicContextPermissions && (
          <Collapse>
            <CollapsePanel header={t('publicContextHeader')}>
              {publicContextPermissions.canArchive && (
              <FormItem>
                <Checkbox checked={publicContext.archived} onChange={handleArchivedChange}>
                  <span className="u-label">{t('common:archived')}</span>
                  <Tooltip title={t('archivedInfo')}>
                    <InfoCircleOutlined className="u-info-icon" />
                  </Tooltip>
                </Checkbox>
              </FormItem>
              )}
              {publicContextPermissions.canVerify && (
              <FormItem>
                <Checkbox checked={publicContext.verified} onChange={handleVerifiedChange}>
                  <span className="u-label">{t('verified')}</span>
                  <Tooltip title={t('verifiedInfo')}>
                    <InfoCircleOutlined className="u-info-icon" />
                  </Tooltip>
                </Checkbox>
              </FormItem>
              )}
              {publicContextPermissions.canReview && (
                <FormItem
                  label={
                    <Fragment>
                      {t('review')}
                      <Tooltip title={t('reviewInfo')}>
                        <InfoCircleOutlined className="u-info-icon" />
                      </Tooltip>
                    </Fragment>
                  }
                  >
                  <NeverScrollingTextArea value={publicContext.review} onChange={handleReviewChange} />
                </FormItem>
              )}
              {publicContextPermissions.canRestrictOpenContribution && (
                <FormItem
                  label={
                    <Fragment>
                      {t('allowedOpenContribution')}
                      <Tooltip title={t('allowedOpenContributionInfo')}>
                        <InfoCircleOutlined className="u-info-icon" />
                      </Tooltip>
                    </Fragment>
                  }
                  >
                  <Select value={publicContext.allowedOpenContribution} onChange={handleAllowedOpenContributionChange}>
                    {allowedOpenContributionOptions.map(option => <Option key={option.key}>{option.value}</Option>)}
                  </Select>
                </FormItem>
              )}
            </CollapsePanel>
          </Collapse>
        )}
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
