/* eslint-disable complexity */
import Info from './info.js';
import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useUser } from './user-context.js';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { useSettings } from './settings-context.js';
import RoomApiClient from '../api-clients/room-api-client.js';
import LanguageSelect from './localization/language-select.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import errorHelper, { handleApiError } from '../ui/error-helper.js';
import DocumentApiClient from '../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Input, Modal, Checkbox, Select, InputNumber, Empty, Collapse } from 'antd';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, ROOM_USER_ROLE } from '../domain/constants.js';
import { documentExtendedMetadataShape, documentMetadataEditShape, roomShape } from '../ui/default-prop-types.js';
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
  getValidationState
} from './document-metadata-modal-utils.js';

const FormItem = Form.Item;
const Option = Select.Option;
const CollapsePanel = Collapse.Panel;

const logger = new Logger(import.meta.url);

const getDefaultPublicContext = () => (
  {
    archived: false,
    verified: false,
    review: '',
    allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent
  }
);

const getDefaultRoomContext = () => ({ draft: false });

function DocumentMetadataModal({
  isVisible,
  mode,
  allowMultiple,
  onSave,
  onClose,
  documentToClone,
  initialDocumentMetadata,
  initialDocumentRoomMetadata
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [language, setLanguage] = useState(null);
  const [publicContext, setPublicContext] = useState(null);
  const [roomContext, setRoomContext] = useState(null);

  const [generateSequence, setGenerateSequence] = useState(false);
  const [sequenceCount, setSequenceCount] = useState(0);
  const [useTemplateDocument, setUseTemplateDocument] = useState(false);
  const [cloningStrategy, setCloningStrategy] = useState(CLONING_STRATEGY.none);
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

  const validationState = useMemo(
    () => getValidationState({ t, title, description, slug, tags, cloningStrategy, cloningTargetRoomId }),
    [t, title, description, slug, tags, cloningStrategy, cloningTargetRoomId]
  );

  const resetStates = useCallback(() => {
    setTitle(initialDocumentMetadata.title || t('newDocument'));
    setDescription(initialDocumentMetadata.description || '');
    setSlug(initialDocumentMetadata.slug || '');
    setTags(initialDocumentMetadata.tags || []);
    setTagOptions(composeTagOptions(initialDocumentMetadata.tags));
    setLanguage(initialDocumentMetadata.language || getDefaultLanguageFromUiLanguage(uiLanguage));
    if (mode === DOCUMENT_METADATA_MODAL_MODE.clone) {
      setPublicContext(getDefaultPublicContext());
      setRoomContext(getDefaultRoomContext());
    } else {
      setPublicContext(cloneDeep(initialDocumentMetadata.publicContext) || getDefaultPublicContext());
      setRoomContext(cloneDeep(initialDocumentMetadata.roomContext) || getDefaultRoomContext());
    }

    setGenerateSequence(false);
    setSequenceCount(2);
    setUseTemplateDocument(false);
    setCloningStrategy(CLONING_STRATEGY.cloneWithinArea);
    setCloningTargetRoomId('');
  }, [initialDocumentMetadata, mode, t, uiLanguage]);

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
    resetStates();
    loadRooms();
  }, [isVisible, resetStates, loadRooms]);

  useEffect(() => {
    setPublicContext(getDefaultPublicContext());
    setRoomContext(getDefaultRoomContext());
  }, [cloningStrategy]);

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

  const handleDraftChange = event => {
    const { checked } = event.target;
    setRoomContext(prevState => ({ ...prevState, draft: checked }));
  };

  const handleFinish = async () => {
    const invalidFieldsExist = Object.values(validationState).some(field => field.validateStatus === 'error');
    if (invalidFieldsExist) {
      return;
    }

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
        publicContext: documentRoomId ? null : publicContext,
        roomContext: documentRoomId ? roomContext : null
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

  const isDocInPublicContext = !documentRoomId && cloningStrategy !== CLONING_STRATEGY.crossCloneIntoRoom
    && hasPublicContextPermissions && !!publicContext;
  const isDocInRoomContext = !!documentRoomId && !!roomContext;
  const isRoomOwner = cloningStrategy !== CLONING_STRATEGY.crossCloneIntoRoom && initialDocumentRoomMetadata?.owner._id === user._id;

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
          <FormItem label={t('common:room')} {...validationState.cloningTargetRoomId}>
            <Select
              value={cloningTargetRoomId}
              loading={isLoadingRooms}
              onChange={handleCloningTargetRoomIdChange}
              options={cloningOptions.roomOptions}
              notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noAvailableRooms')} />}
              />
          </FormItem>
        )}
        <FormItem label={t('common:title')} {...validationState.title}>
          <Input value={title} onChange={handleTitleChange} />
        </FormItem>
        <FormItem label={t('common:description')} {...validationState.description}>
          <NeverScrollingTextArea value={description} onChange={handleDescriptionChange} />
        </FormItem>
        <FormItem label={t('common:language')}>
          <LanguageSelect value={language} onChange={handleLanguageChange} />
        </FormItem>
        <FormItem label={t('common:slug')} {...validationState.slug}>
          <Input value={slug} onChange={handleSlugChange} />
        </FormItem>
        <FormItem label={t('common:tags')} {...validationState.tags}>
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
              <Info tooltip={t('sequenceInfo')} iconAfterContent>{t('generateSequence')}</Info>
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
        {isDocInPublicContext && (
          <Collapse>
            <CollapsePanel header={t('publicContextHeader')}>
              {publicContextPermissions.canArchive && (
              <FormItem>
                <Checkbox checked={publicContext.archived} onChange={handleArchivedChange}>
                  <Info tooltip={t('archivedInfo')} iconAfterContent><span className="u-label">{t('common:archived')}</span></Info>
                </Checkbox>
              </FormItem>
              )}
              {publicContextPermissions.canVerify && (
              <FormItem>
                <Checkbox checked={publicContext.verified} onChange={handleVerifiedChange}>
                  <Info tooltip={t('verifiedInfo')} iconAfterContent><span className="u-label">{t('verified')}</span></Info>
                </Checkbox>
              </FormItem>
              )}
              {publicContextPermissions.canReview && (
                <FormItem
                  label={
                    <Info tooltip={t('reviewInfo')} iconAfterContent>{t('review')}</Info>
                  }
                  >
                  <NeverScrollingTextArea value={publicContext.review} onChange={handleReviewChange} />
                </FormItem>
              )}
              {publicContextPermissions.canRestrictOpenContribution && (
                <FormItem
                  label={
                    <Info tooltip={t('allowedOpenContributionInfo')} iconAfterContent>{t('allowedOpenContribution')}</Info>
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
        {!!isDocInRoomContext && !!isRoomOwner && (
          <FormItem>
            <Checkbox checked={roomContext.draft} onChange={handleDraftChange}>
              <Info tooltip={t('draftInfo')} iconAfterContent> <span className="u-label">{t('draft')}</span></Info>
            </Checkbox>
          </FormItem>
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
  initialDocumentRoomMetadata: roomShape,
  isVisible: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(Object.values(DOCUMENT_METADATA_MODAL_MODE)).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

DocumentMetadataModal.defaultProps = {
  allowMultiple: false,
  documentToClone: null,
  initialDocumentRoomMetadata: null
};

export default DocumentMetadataModal;
