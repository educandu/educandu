import { notification } from 'antd';

export function handleApiError(error, logger) {
  const err = error.response && error.response.body ? error.response.body : error;

  notification.error({
    message: `${err.name || 'Fehler'}`,
    description: err.message,
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
