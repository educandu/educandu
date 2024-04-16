import PropTypes from 'prop-types';
import { Modal, Spin } from 'antd';
import Markdown from './markdown.js';
import Logger from '../common/logger.js';
import StarRating from './star-rating.js';
import DeleteButton from './delete-button.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { handleApiError } from '../ui/error-helper.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import React, { useCallback, useEffect, useState } from 'react';
import { documentRatingShape } from '../ui/default-prop-types.js';
import DocumentRatingApiClient from '../api-clients/document-ratings-api-client.js';

const logger = new Logger(import.meta.url);

function UserDocumentRatingDialog({ documentRating, isOpen, onCancel, onOk }) {
  const { formatDate } = useDateFormat();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('userDocumentRatingDialog');
  const [existingUserRating, setExistingUserRating] = useState(null);
  const [newUserRatingValue, setNewUserRatingValue] = useState(null);
  const documentRatingApiClient = useSessionAwareApiClient(DocumentRatingApiClient);

  const { documentId } = documentRating;

  const loadUserRating = useCallback(async () => {
    try {
      setIsLoading(true);
      const userRating = await documentRatingApiClient.getUserDocumentRating({ documentId });
      setExistingUserRating(userRating);
      setNewUserRatingValue(userRating?.rating || null);
      setIsLoading(false);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  }, [documentId, documentRatingApiClient, t]);

  useEffect(() => {
    if (isOpen) {
      loadUserRating();
    }
  }, [isOpen, loadUserRating]);

  const handleOk = async () => {
    try {
      setIsSaving(true);
      const response = newUserRatingValue !== null
        ? await documentRatingApiClient.saveUserDocumentRating({ documentId, rating: newUserRatingValue })
        : await documentRatingApiClient.deleteUserDocumentRating({ documentId });
      setIsSaving(false);
      onOk(response.documentRating);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleClearButtonClick = () => {
    setNewUserRatingValue(null);
  };

  return (
    <Modal
      open={isOpen}
      destroyOnClose
      closable={false}
      title={t('title')}
      maskClosable={false}
      okText={t('common:apply')}
      cancelButtonProps={{ disabled: isSaving }}
      okButtonProps={{ disabled: isLoading, loading: isSaving }}
      onOk={handleOk}
      onCancel={onCancel}
      >
      <div className="u-modal-body">
        <Spin spinning={isLoading}>
          {!existingUserRating && (
            <Markdown className="UserDocumentRatingDialog-explanation">
              {t('noExistingRatingExplanationMarkdown')}
            </Markdown>
          )}
          {!!existingUserRating && (
            <Markdown className="UserDocumentRatingDialog-explanation">
              {t('existingRatingExplanationMarkdown', {
                ratingDate: formatDate(existingUserRating.ratedOn, 'L'),
                ratingValue: existingUserRating.rating
              })}
            </Markdown>
          )}
          <div className="UserDocumentRatingDialog-newRatingHeader">
            {t('newRatingHeader')}:
          </div>
          <div className="UserDocumentRatingDialog-newRating">
            <div>
              <StarRating value={newUserRatingValue} onChange={setNewUserRatingValue} />
            </div>
            <div className="UserDocumentRatingDialog-newRatingValue">
              ({newUserRatingValue ? t('newRatingValue', { ratingValue: newUserRatingValue }) : t('noNewRating')})
            </div>
            <div>
              <DeleteButton onClick={handleClearButtonClick} disabled={newUserRatingValue === null} />
            </div>
          </div>
        </Spin>
      </div>
    </Modal>
  );
}

UserDocumentRatingDialog.propTypes = {
  documentRating: documentRatingShape.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired
};

export default UserDocumentRatingDialog;
