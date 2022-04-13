import { notification } from 'antd';
import { ERROR_CODES } from '../domain/constants.js';

const tryToTranslateMessage = (error, t) => {
  if (error.status !== 400) {
    return null;
  }

  const isSlugInvalid = error.details?.find(detail => detail.context?.key === 'slug');
  return isSlugInvalid ? t('common:invalidSlug') : null;
};

export function handleApiError({ error, logger, t }) {
  const err = error.response?.body || error;

  if (err.code !== ERROR_CODES.operationCancelled) {
    notification.error({
      message: err.name || t('common:error'),
      description: tryToTranslateMessage(err, t) || err.message,
      duration: 10
    });
  }

  try {
    logger.error(err);
  } catch {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

export function handleError({ message, error, logger, t, duration = 10 }) {
  const err = error.response?.body || error;

  if (err.code !== ERROR_CODES.operationCancelled) {
    notification.error({
      message: t('common:error'),
      description: message || err.message,
      duration
    });
  }

  try {
    logger.error(err);
  } catch {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

export default {
  handleApiError
};
