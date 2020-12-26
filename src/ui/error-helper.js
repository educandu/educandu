import { notification } from 'antd';

export function handleApiError(error, logger) {
  const err = error.response && error.response.body ? error.response.body : error;

  if (logger) {
    logger.error(err);
  }

  notification.error({
    message: `${err.name || 'Fehler'}`,
    description: err.message,
    duration: 10
  });
}

export default {
  handleApiError
};
