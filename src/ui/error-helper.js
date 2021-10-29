import { notification } from 'antd';

const tryToTranslateMessage = (error, t) => {
  if (error.status !== 400) {
    return null;
  }

  const isSlugInvalid = error.details?.find(detail => detail.context?.key === 'slug');
  return isSlugInvalid ? t('common:invalidSlug') : null;
};

export function handleApiError({ error, logger, t }) {
  const err = error.response && error.response.body ? error.response.body : error;

  notification.error({
    message: `${err.name || 'Fehler'}`,
    description: tryToTranslateMessage(err, t) || err.message,
    duration: 10
  });

  try {
    if (logger) {
      logger.error(err);
    }
  } catch {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

export default {
  handleApiError
};
