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

function RatingDialog({ documentRating, isOpen, onCancel, onOk }) {
  const { formatDate } = useDateFormat();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('ratingDialog');
  const [existingRating, setExistingRating] = useState(null);
  const [newRatingValue, setNewRatingValue] = useState(null);
  const documentRatingApiClient = useSessionAwareApiClient(DocumentRatingApiClient);

  const { documentId } = documentRating;

  const loadRating = useCallback(async () => {
    try {
      setIsLoading(true);
      const userRating = await documentRatingApiClient.getRating({ documentId });
      setExistingRating(userRating);
      setNewRatingValue(userRating?.value || null);
      setIsLoading(false);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  }, [documentId, documentRatingApiClient, t]);

  useEffect(() => {
    if (isOpen) {
      loadRating();
    }
  }, [isOpen, loadRating]);

  const handleOk = async () => {
    try {
      setIsSaving(true);
      const response = newRatingValue !== null
        ? await documentRatingApiClient.saveRating({ documentId, value: newRatingValue })
        : await documentRatingApiClient.deleteRating({ documentId });
      setIsSaving(false);
      onOk(response.documentRating);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleClearButtonClick = () => {
    setNewRatingValue(null);
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
          {!existingRating && (
            <Markdown className="RatingDialog-explanation">
              {t('noExistingRatingExplanationMarkdown')}
            </Markdown>
          )}
          {!!existingRating && (
            <Markdown className="RatingDialog-explanation">
              {t('existingRatingExplanationMarkdown', {
                ratingDate: formatDate(existingRating.ratedOn, 'L'),
                ratingValue: existingRating.value
              })}
            </Markdown>
          )}
          <div className="RatingDialog-newRatingHeader">
            {t('newRatingHeader')}:
          </div>
          <div className="RatingDialog-newRating">
            <div>
              <StarRating value={newRatingValue} onChange={setNewRatingValue} />
            </div>
            <div className="RatingDialog-newRatingValue">
              ({newRatingValue ? t('newRatingValue', { ratingValue: newRatingValue }) : t('noNewRating')})
            </div>
            <div>
              <DeleteButton onClick={handleClearButtonClick} disabled={newRatingValue === null} />
            </div>
          </div>
        </Spin>
      </div>
    </Modal>
  );
}

RatingDialog.propTypes = {
  documentRating: documentRatingShape.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired
};

export default RatingDialog;
