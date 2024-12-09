import Info from './info.js';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import TagSelect from './tag-select.js';
import Logger from '../common/logger.js';
import UserSelect from './user-select.js';
import { useUser } from './user-context.js';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { SettingsIcon } from './icons/icons.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import DocumentSelector from './document-selector.js';
import { handleApiError } from '../ui/error-helper.js';
import { ROOM_USER_ROLE } from '../domain/constants.js';
import ClientConfig from '../bootstrap/client-config.js';
import WarningIcon from './icons/general/warning-icon.js';
import RoomApiClient from '../api-clients/room-api-client.js';
import UserApiClient from '../api-clients/user-api-client.js';
import LanguageSelect from './localization/language-select.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { isRoomMediaSourceType } from '../utils/source-utils.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import DocumentApiClient from '../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { ensureIsExcluded, ensureIsIncluded } from '../utils/array-utils.js';
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { documentExtendedMetadataShape, documentMetadataEditShape } from '../ui/default-prop-types.js';
import { Form, Input, Modal, Checkbox, Select, InputNumber, Empty, Collapse, Radio, Button, Tooltip } from 'antd';
import { maxDocumentRevisionCreatedBecauseLength, maxDocumentShortDescriptionLength } from '../domain/validation-constants.js';
import {
  CLONING_STRATEGY,
  determineActualTemplateDocumentId,
  determineDocumentRoomId,
  DOCUMENT_METADATA_MODAL_MODE,
  getCloningOptions,
  getDefaultLanguageFromUiLanguage,
  getDialogOkButtonText,
  getDialogTitle,
  getValidationState
} from './document-metadata-modal-utils.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const logger = new Logger(import.meta.url);

const getDefaultPublicContext = () => (
  {
    allowedEditors: [],
    protected: false,
    archived: false,
    verified: false,
    review: ''
  }
);

const getDefaultRoomContext = () => (
  {
    draft: false,
    inputSubmittingDisabled: false
  }
);

function DocumentMetadataModal({
  isOpen,
  mode,
  onSave,
  onClose,
  allowDraftInRoomContext,
  allowMultipleInCreateMode,
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
  const userApiClient = useSessionAwareApiClient(UserApiClient);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [isSaving, setIsSaving] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState([]);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState(null);
  const [roomContext, setRoomContext] = useState(null);
  const [publicContext, setPublicContext] = useState(null);
  const [shortDescription, setShortDescription] = useState('');
  const [revisionCreatedBecause, setRevisionCreatedBecause] = useState('');

  const [sequenceCount, setSequenceCount] = useState(0);
  const [generateSequence, setGenerateSequence] = useState(false);
  const [cloningTargetRoomId, setCloningTargetRoomId] = useState('');
  const [useTemplateDocument, setUseTemplateDocument] = useState(false);
  const [showExtendedSaveScreen, setShowExtendedSaveScreen] = useState(false);
  const [cloningStrategy, setCloningStrategy] = useState(CLONING_STRATEGY.none);

  const documentRoomId = useMemo(() => determineDocumentRoomId({
    mode,
    initialDocumentMetadata,
    documentToClone,
    cloningStrategy,
    cloningTargetRoomId
  }), [mode, initialDocumentMetadata, documentToClone, cloningStrategy, cloningTargetRoomId]);

  const publicContextPermissions = {
    canManagePublicContent: hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT),
    canManageAssignedEditors: hasUserPermission(user, permissions.MANAGE_ASSIGNED_EDITORS),
    canManageProtectedContent: hasUserPermission(user, permissions.MANAGE_PROTECTED_CONTENT),
    canProtectOwnDocWhenCreating: hasUserPermission(user, permissions.PROTECT_OWN_PUBLIC_CONTENT)
  };
  const hasPublicContextPermissions = Object.values(publicContextPermissions).some(value => value);

  const cloningOptions = getCloningOptions({ mode, documentToClone, availableRooms, t });

  const defaultTemplateDocumentId = settings.templateDocument?.documentId || null;
  const canUseTemplateDocument = mode === DOCUMENT_METADATA_MODAL_MODE.create && !!defaultTemplateDocumentId;
  const canCreateSequence = mode === DOCUMENT_METADATA_MODAL_MODE.create && allowMultipleInCreateMode;
  const canSelectCloningStrategy = mode === DOCUMENT_METADATA_MODAL_MODE.clone && cloningOptions.strategyOptions.length > 1;
  const canSaveThroughExtendedSaveScreen = mode === DOCUMENT_METADATA_MODAL_MODE.update;

  const validationState = useMemo(
    () => getValidationState({ t, title, shortDescription, slug, tags, cloningStrategy, cloningTargetRoomId }),
    [t, title, shortDescription, slug, tags, cloningStrategy, cloningTargetRoomId]
  );

  const resetStates = useCallback(() => {
    setTitle(initialDocumentMetadata.title || t('newDocument'));
    setShortDescription(initialDocumentMetadata.shortDescription || '');
    setSlug(initialDocumentMetadata.slug || '');
    setTags(initialDocumentMetadata.tags || []);
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
    setShowExtendedSaveScreen(false);
    setRevisionCreatedBecause('');
  }, [initialDocumentMetadata, mode, t, uiLanguage]);

  const loadRooms = useCallback(async () => {
    if (mode !== DOCUMENT_METADATA_MODAL_MODE.clone) {
      setAvailableRooms([]);
      setIsLoadingRooms(false);
      return;
    }

    setAvailableRooms([]);
    setIsLoadingRooms(true);

    const { rooms } = await roomApiClient.getRooms({ userRole: ROOM_USER_ROLE.ownerOrCollaborator });
    setAvailableRooms(rooms);

    setIsLoadingRooms(false);
  }, [mode, roomApiClient]);

  useEffect(() => {
    resetStates();
    loadRooms();
  }, [isOpen, resetStates, loadRooms]);

  useEffect(() => {
    setPublicContext(getDefaultPublicContext());
    setRoomContext(getDefaultRoomContext());
  }, [cloningStrategy]);

  const invalidFieldsExist = () => Object.values(validationState).some(field => field.validateStatus === 'error');

  const handleTagSuggestionsNeeded = searchText => {
    return documentApiClient.getDocumentTagSuggestions(searchText).catch(error => {
      handleApiError({ error, logger, t });
      return [];
    });
  };

  const handleModalSaveClick = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleModalExtendedSaveClick = () => {
    if (invalidFieldsExist()) {
      return;
    }
    setShowExtendedSaveScreen(true);
  };

  const handleModalBackClick = () => {
    setShowExtendedSaveScreen(false);
  };

  const handleModalCancelClick = () => {
    onClose();
  };

  const handleUserSuggestionsNeeded = async searchText => {
    try {
      const { users } = await userApiClient.searchUsers({ query: searchText });
      return users;
    } catch (error) {
      handleApiError({ error, logger, t });
      return [];
    }
  };

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

  const handleShortDescriptionChange = event => {
    const { value } = event.target;
    setShortDescription(value);
  };

  const handleLanguageChange = value => {
    setLanguage(value);
  };

  const handleSlugChange = event => {
    const { value } = event.target;
    setSlug(value);
  };

  const handleGenerateSequenceChange = event => {
    const { checked } = event.target;
    setGenerateSequence(checked);
    setUseTemplateDocument(false);
  };

  const handleSequenceCountChange = value => {
    setSequenceCount(value);
  };

  const handleUseTemplateDocumentChange = event => {
    const { value } = event.target;
    setUseTemplateDocument(value);
  };

  const handleAllowedEditorsChange = value => {
    setPublicContext(prevState => ({ ...prevState, allowedEditors: value }));
  };

  const handleProtectedChange = event => {
    setPublicContext(prevState => {
      const newProtected = event.target.checked;

      let newAllowedEditors = prevState.allowedEditors;
      if (!publicContextPermissions.canManageAssignedEditors
        && publicContextPermissions.canProtectOwnDocWhenCreating
        && mode !== DOCUMENT_METADATA_MODAL_MODE.update
      ) {
        newAllowedEditors = newProtected
          ? ensureIsIncluded(newAllowedEditors, user)
          : ensureIsExcluded(newAllowedEditors, user);
      }

      return { ...prevState, protected: newProtected, allowedEditors: newAllowedEditors };
    });
  };

  const handleArchivedChange = event => {
    const { checked } = event.target;
    setPublicContext(prevState => (
      {
        ...prevState,
        archived: checked,
        archiveRedirectionDocumentId: null
      }));
  };

  const handleArchiveRedirectionDocumentIdChange = documentId => {
    setPublicContext(prevState => (
      {
        ...prevState,
        archiveRedirectionDocumentId: documentId
      }));
  };

  const handleVerifiedChange = event => {
    const { checked } = event.target;
    setPublicContext(prevState => ({ ...prevState, verified: checked }));
  };

  const handleReviewChange = event => {
    const { value } = event.target;
    setPublicContext(prevState => ({ ...prevState, review: value }));
  };

  const handleDraftChange = event => {
    const { checked } = event.target;
    setRoomContext(prevState => ({ ...prevState, draft: checked }));
  };

  const handleInputSubmittingDisabledChange = event => {
    const { checked } = event.target;
    setRoomContext(prevState => ({ ...prevState, inputSubmittingDisabled: checked }));
  };

  const handleRevisionCreatedBecauseChange = event => {
    const { value } = event.target;
    setRevisionCreatedBecause(value);
  };

  const handleFinish = async () => {
    if (invalidFieldsExist()) {
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

      const mappedPublicContext = {
        ...publicContext,
        allowedEditors: publicContext.allowedEditors.map(e => e._id)
      };

      const mappedDocument = {
        title: title.trim(),
        slug: slug.trim(),
        shortDescription,
        language,
        tags,
        publicContext: documentRoomId ? null : mappedPublicContext,
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
            savedDocuments.push(await documentApiClient.createDocument(documentToSave));
          }
          break;
        case DOCUMENT_METADATA_MODAL_MODE.publish:
          savedDocuments.push(await documentApiClient.publishDocument({
            documentId: initialDocumentMetadata._id,
            metadata: mappedDocument
          }));
          break;
        case DOCUMENT_METADATA_MODAL_MODE.update:
          savedDocuments.push(await documentApiClient.updateDocumentMetadata({
            documentId: initialDocumentMetadata._id,
            metadata: mappedDocument,
            revisionCreatedBecause: showExtendedSaveScreen ? revisionCreatedBecause.trim() : ''
          }));
          break;
        default:
          throw new Error(`Invalid document metadata modal mode: '${mode}'`);
      }

      onSave(savedDocuments, actualTemplateDocumentId);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  const isDocInPublicContext = !documentRoomId && cloningStrategy !== CLONING_STRATEGY.crossCloneIntoRoom
    && hasPublicContextPermissions && !!publicContext;
  const isDocInRoomContext = !!documentRoomId && !!roomContext;
  const showDraftInput = isDocInRoomContext && allowDraftInRoomContext && cloningStrategy !== CLONING_STRATEGY.crossCloneIntoRoom;
  const internalCdnResourcesCount = (initialDocumentMetadata.cdnResources || []).filter(url => isRoomMediaSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl })).length;

  return (
    <Modal
      title={getDialogTitle(mode, t)}
      className='u-modal'
      open={isOpen}
      maskClosable={false}
      onCancel={handleModalCancelClick}
      footer={[
        !!showExtendedSaveScreen && (
          <Button key="back" onClick={handleModalBackClick}>
            {t('common:back')}
          </Button>
        ),
        !showExtendedSaveScreen && (
          <Button key="cancel" onClick={handleModalCancelClick}>
            {t('common:cancel')}
          </Button>
        ),
        <Button
          key="save"
          type="primary"
          loading={isSaving}
          className={classNames(
            'DocumentMetadataModal-saveButton',
            { 'DocumentMetadataModal-saveButton--withExtension': !!canSaveThroughExtendedSaveScreen && !showExtendedSaveScreen }
          )}
          onClick={handleModalSaveClick}
          >
          {getDialogOkButtonText(mode, t)}
        </Button>,
        !!canSaveThroughExtendedSaveScreen && !showExtendedSaveScreen && (
          <Tooltip title={t('extendedSaveTooltip')} key="extendedSave">
            <Button
              type="primary"
              icon={<SettingsIcon />}
              className='DocumentMetadataModal-extendedSaveButton'
              onClick={handleModalExtendedSaveClick}
              />
          </Tooltip>
        )
      ]}
      >
      {mode === DOCUMENT_METADATA_MODAL_MODE.publish && (
        <div className='DocumentMetadataModal-infoContent'>
          <Markdown>{t('publishingInfoMarkdown')}</Markdown>
          {!!internalCdnResourcesCount && (
            <div className="DocumentMetadataModal-infoContentWarning">
              <WarningIcon className="DocumentMetadataModal-infoContentWarningIcon" />
              <div>{t('publishingInfoWarning', { count: internalCdnResourcesCount })}</div>
            </div>
          )}
        </div>
      )}
      <Form ref={formRef} layout="vertical" onFinish={handleFinish} className="u-modal-body">
        <div className={classNames('DocumentMetadataModal-formContent', { 'is-hidden' : !!showExtendedSaveScreen })}>
          {!!canSelectCloningStrategy && (
            <FormItem label={t('cloningStrategy')} >
              <Select value={cloningStrategy} options={cloningOptions.strategyOptions} onChange={handleCloningStrategyChange} />
            </FormItem>
          )}
          {!!canSelectCloningStrategy && cloningStrategy === CLONING_STRATEGY.crossCloneIntoRoom && (
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
          <FormItem
            {...validationState.shortDescription}
            label={
              <Info tooltip={t('common:shortDescriptionInfo')} iconAfterContent>{t('common:shortDescription')}</Info>
            }
            >
            <NeverScrollingTextArea
              value={shortDescription}
              maxLength={maxDocumentShortDescriptionLength}
              onChange={handleShortDescriptionChange}
              />
          </FormItem>
          <FormItem label={t('common:language')}>
            <LanguageSelect value={language} onChange={handleLanguageChange} />
          </FormItem>
          <FormItem
            {...validationState.slug}
            label={
              <Info tooltip={t('common:slugInfo')} iconAfterContent>{t('common:slug')}</Info>
            }
            >
            <Input value={slug} onChange={handleSlugChange} />
          </FormItem>
          <FormItem
            {...validationState.tags}
            label={
              <Info tooltip={t('tagsInfo')} iconAfterContent>{t('common:tags')}</Info>
            }
            >
            <TagSelect
              value={tags}
              placeholder={t('common:tagsPlaceholder')}
              initialValue={initialDocumentMetadata.tags || []}
              onChange={setTags}
              onSuggestionsNeeded={handleTagSuggestionsNeeded}
              />
          </FormItem>
          {!!canCreateSequence && (
            <FormItem>
              <Checkbox checked={generateSequence} onChange={handleGenerateSequenceChange}>
                <Info tooltip={t('sequenceInfo')} iconAfterContent>
                  <span className="u-label">{t('generateSequence')}</span>
                </Info>
              </Checkbox>
            </FormItem>
          )}
          {!!canCreateSequence && !!generateSequence && (
            <FormItem label={t('sequenceCount')} rules={[{ type: 'integer', min: 2, max: 100 }]}>
              <InputNumber value={sequenceCount} onChange={handleSequenceCountChange} className="DocumentMetadataModal-sequenceInput" min={2} max={100} />
            </FormItem>
          )}
          {!!canUseTemplateDocument && (
            <FormItem
              label={
                <Info tooltip={t('contentInfo')} iconAfterContent>{t('content')}</Info>
              }
              >
              <RadioGroup value={useTemplateDocument} disabled={!!generateSequence} onChange={handleUseTemplateDocumentChange}>
                <RadioButton value={false}>{t('contentEmpty')}</RadioButton>
                <RadioButton value={Boolean('true')}>{t('contentFromTemplate')}</RadioButton>
              </RadioGroup>
            </FormItem>
          )}
          {!!isDocInPublicContext && (
            <Collapse
              items={[{
                key: 'extendedSettingsHeader',
                label: t('extendedSettingsHeader'),
                children: (
                  <Fragment>
                    {!!publicContextPermissions.canManageAssignedEditors && (
                    <FormItem label={<Info tooltip={t('allowedEditorsInfo')} iconAfterContent>{t('allowedEditors')}</Info>}>
                      <UserSelect value={publicContext.allowedEditors} onChange={handleAllowedEditorsChange} onSuggestionsNeeded={handleUserSuggestionsNeeded} />
                    </FormItem>
                    )}
                    {(!!publicContextPermissions.canManageProtectedContent || !!publicContextPermissions.canProtectOwnDocWhenCreating) && (
                    <FormItem>
                      <Checkbox
                        checked={publicContext.protected}
                        onChange={handleProtectedChange}
                        disabled={
                          !publicContextPermissions.canManageProtectedContent && mode === DOCUMENT_METADATA_MODAL_MODE.update
                        }
                        >
                        <Info tooltip={t('protectedInfo')} iconAfterContent><span className="u-label">{t('common:protected')}</span></Info>
                      </Checkbox>
                    </FormItem>
                    )}
                    {!!publicContextPermissions.canManagePublicContent && (
                    <Fragment>
                      <FormItem>
                        <Checkbox checked={publicContext.archived} onChange={handleArchivedChange}>
                          <Info tooltip={t('archivedInfo')} iconAfterContent><span className="u-label">{t('common:archived')}</span></Info>
                        </Checkbox>
                      </FormItem>
                      {!!publicContext.archived && (
                      <FormItem label={<Info tooltip={t('archiveRedirectionInfo')} iconAfterContent>{t('archiveRedirectionLabel')}</Info>}>
                        <DocumentSelector documentId={publicContext.archiveRedirectionDocumentId} onChange={handleArchiveRedirectionDocumentIdChange} />
                      </FormItem>
                      )}
                      <FormItem>
                        <Checkbox checked={publicContext.verified} onChange={handleVerifiedChange}>
                          <Info tooltip={t('verifiedInfo')} iconAfterContent><span className="u-label">{t('verified')}</span></Info>
                        </Checkbox>
                      </FormItem>
                      <FormItem label={<Info tooltip={t('reviewInfo')} iconAfterContent>{t('review')}</Info>}>
                        <NeverScrollingTextArea value={publicContext.review} onChange={handleReviewChange} />
                      </FormItem>
                    </Fragment>
                    )}
                  </Fragment>
                )
              }]}
              />
          )}
          {!!isDocInRoomContext && (
            <Fragment>
              {!!showDraftInput && (
                <FormItem>
                  <Checkbox checked={roomContext.draft} onChange={handleDraftChange}>
                    <Info tooltip={t('draftInfo')} iconAfterContent> <span className="u-label">{t('draft')}</span></Info>
                  </Checkbox>
                </FormItem>
              )}
              <FormItem>
                <Checkbox checked={roomContext.inputSubmittingDisabled} onChange={handleInputSubmittingDisabledChange}>
                  <Info tooltip={t('inputSubmittingDisabledInfo')} iconAfterContent>
                    <span className="u-label">{t('inputSubmittingDisabled')}</span>
                  </Info>
                </Checkbox>
              </FormItem>
            </Fragment>
          )}
        </div>

        <div className={classNames('DocumentMetadataModal-formContent', { 'is-hidden' : !showExtendedSaveScreen })}>
          <FormItem label={t('common:documentRevisionCreatedBecauseLabel')}>
            <NeverScrollingTextArea
              value={revisionCreatedBecause}
              maxLength={maxDocumentRevisionCreatedBecauseLength}
              onChange={handleRevisionCreatedBecauseChange}
              />
          </FormItem>
        </div>
      </Form>
    </Modal>
  );
}

DocumentMetadataModal.propTypes = {
  allowDraftInRoomContext: PropTypes.bool,
  allowMultipleInCreateMode: PropTypes.bool,
  documentToClone: documentExtendedMetadataShape,
  initialDocumentMetadata: PropTypes.oneOfType([
    PropTypes.shape({ roomId: PropTypes.string }),
    documentMetadataEditShape
  ]).isRequired,
  isOpen: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(Object.values(DOCUMENT_METADATA_MODAL_MODE)).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

DocumentMetadataModal.defaultProps = {
  allowDraftInRoomContext: false,
  allowMultipleInCreateMode: false,
  documentToClone: null
};

export default DocumentMetadataModal;
