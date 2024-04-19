import { TAB } from './constants.js';
import { Button, Modal } from 'antd';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';

function MaintenanceDocumentCategoriesTab() {
  const { t } = useTranslation('maintenanceDocumentCategoriesTab');

  const [modalState, setModalState] = useState({ isOpen: false, documentCategory: null });

  useEffect(() => {
    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.documentCategories));
  }, []);

  const handleModalOk = () => {
    setModalState({ isOpen: false, documentCategory: null });
  };

  const handleModalCancel = () => {
    setModalState({ isOpen: false, documentCategory: null });
  };

  const handleCreateDocumentCategoryClick = () => {
    setModalState({ isOpen: true, documentCategory: null });
  };

  return (
    <div className="MaintenanceDocumentCategoriesTab">
      <div className="MaintenanceDocumentCategoriesTab-controls">
        <div>Filter and sorting</div>
        <Button type="primary" onClick={handleCreateDocumentCategoryClick}>
          {t('common:create')}
        </Button>
      </div>

      <Modal
        maskClosable={false}
        open={modalState.isOpen}
        okText={t('common:create')}
        cancelText={t('common:cancel')}
        title={modalState.documentCategory ? t('modalEditTitle') : t('modalCreateTitle')}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        >
        {/* <Form ref={formRef} layout="vertical" onFinish={handleFinish} className="u-modal-body">
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
            <Collapse>
              <CollapsePanel header={t('maintenanceSettingsHeader')}>
                {!!publicContextPermissions.canManagePublicContext && (
                  <FormItem label={<Info tooltip={t('allowedEditorsInfo')} iconAfterContent>{t('allowedEditors')}</Info>}>
                    <UserSelect value={publicContext.allowedEditors} onChange={handleAllowedEditorsChange} onSuggestionsNeeded={handleUserSuggestionsNeeded} />
                  </FormItem>
                )}
                {(!!publicContextPermissions.canManagePublicContext || !!publicContextPermissions.canProtectOwnDocWhenCreating) && (
                  <FormItem>
                    <Checkbox
                      checked={publicContext.protected}
                      onChange={handleProtectedChange}
                      disabled={
                        !publicContextPermissions.canManagePublicContext && mode === DOCUMENT_METADATA_MODAL_MODE.update
                      }
                      >
                      <Info tooltip={t('protectedInfo')} iconAfterContent><span className="u-label">{t('common:protected')}</span></Info>
                    </Checkbox>
                  </FormItem>
                )}
                {!!publicContextPermissions.canManagePublicContext && (
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
              </CollapsePanel>
            </Collapse>
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
        </Form> */}
      </Modal>
    </div>
  );
}

export default MaintenanceDocumentCategoriesTab;
