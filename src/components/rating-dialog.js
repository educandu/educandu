import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import StarRating from './star-rating.js';
import { useUser } from './user-context.js';
import DeleteButton from './delete-button.js';
import { useTranslation } from 'react-i18next';
import DocumentRating from './document-rating.js';
import { Divider, Modal, Progress, Spin } from 'antd';
import { handleApiError } from '../ui/error-helper.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { documentRatingShape } from '../ui/default-prop-types.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import DocumentRatingApiClient from '../api-clients/document-rating-api-client.js';

const logger = new Logger(import.meta.url);

const STAR_STROKE_COLOR = 'rgb(250, 219, 20)';

function RatingDialog({ documentRating, isOpen, onDocumentRatingChange, onClose }) {
  const user = useUser();
  const { t } = useTranslation('ratingDialog');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRatingValue, setUserRatingValue] = useState(null);
  const documentRatingApiClient = useSessionAwareApiClient(DocumentRatingApiClient);

  const { documentId } = documentRating;

  const loadRating = useCallback(async () => {
    try {
      setIsLoading(true);
      const rating = await documentRatingApiClient.getRating({ documentId });
      setUserRatingValue(rating?.value || null);
      setIsLoading(false);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  }, [documentId, documentRatingApiClient, t]);

  useEffect(() => {
    if (isOpen && user) {
      loadRating();
    }
  }, [isOpen, user, loadRating]);

  const handleUserRatingValueChange = async val => {
    try {
      setIsSaving(true);
      setUserRatingValue(val);
      const response = await documentRatingApiClient.saveRating({ documentId, value: val });
      setIsSaving(false);
      onDocumentRatingChange(response.documentRating);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleClearButtonClick = async () => {
    try {
      setIsSaving(true);
      setUserRatingValue(null);
      const response = await documentRatingApiClient.deleteRating({ documentId });
      setIsSaving(false);
      onDocumentRatingChange(response.documentRating);
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  return (
    <Modal
      open={isOpen}
      footer={null}
      destroyOnClose
      title={t('title')}
      onCancel={onClose}
      >
      <div className="u-modal-body">
        <Spin spinning={isLoading || isSaving}>
          <div className="RatingDialog-header">
            {t('totalRatingHeader')}
          </div>
          <div className="RatingDialog-documentRatingAverage">
            <DocumentRating
              oneLine
              value={documentRating.averageRatingValue}
              totalCount={documentRating.ratingsCount}
              />
          </div>
          <div className="RatingDialog-documentRatingDrillDown">
            {documentRating.ratingsCountPerValue.map((value, index) => (
              <Fragment key={index}>
                <div>{t('stars', { starCount: index + 1 })}</div>
                <div>
                  <Progress
                    size="small"
                    showInfo={false}
                    strokeColor={STAR_STROKE_COLOR}
                    percent={documentRating.ratingsCount ? (value / documentRating.ratingsCount) * 100 : 0}
                    />
                </div>
                <div>{value}</div>
              </Fragment>
            ))}
          </div>
          {!!user && (
            <Fragment>
              <Divider />
              <div className="RatingDialog-header">
                {t('userRatingHeader')}
              </div>
              <div className="RatingDialog-userRatingExplanation">
                {t('userRatingExplanation')}
              </div>
              <div className="RatingDialog-userRating">
                <div>
                  <StarRating value={userRatingValue} onChange={handleUserRatingValueChange} />
                </div>
                <div className="RatingDialog-userRatingValue">
                  ({userRatingValue ? t('stars', { starCount: userRatingValue }) : t('noUserRating')})
                </div>
                <div>
                  <DeleteButton onClick={handleClearButtonClick} disabled={userRatingValue === null} />
                </div>
              </div>
            </Fragment>
          )}
        </Spin>
      </div>
    </Modal>
  );
}

RatingDialog.propTypes = {
  documentRating: documentRatingShape.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onDocumentRatingChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default RatingDialog;
