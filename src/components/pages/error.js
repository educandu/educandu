import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { HTTP_STATUS } from '../../domain/constants.js';
import EmptyState, { EMPTY_STATE_STATUS } from '../empty-state.js';
import { ArrowLeftOutlined, ExclamationCircleFilled, FileSearchOutlined, HomeOutlined, StopFilled } from '@ant-design/icons';

function ErrorPage({ PageTemplate, initialState }) {
  const { t } = useTranslation('error');

  const { error } = initialState;

  let icon;
  let status;
  let title;
  let subtitle;

  const handleBackClick = () => {
    window.history.back();
  };

  const handleHomeClick = () => {
    window.location = routes.getHomeUrl();
  };

  switch (error?.status) {
    case HTTP_STATUS.notFound:
      status = EMPTY_STATE_STATUS.info;
      icon = <FileSearchOutlined />;
      title = t('notFoundEmptyStateTitle');
      subtitle = t('notFoundEmptyStateSubtitle');
      break;
    case HTTP_STATUS.badRequest:
      status = EMPTY_STATE_STATUS.error;
      icon = <ExclamationCircleFilled />;
      title = t('badRequestEmptyStateTitle');
      subtitle = t('badRequestEmptyStateSubtitle');
      break;
    case HTTP_STATUS.unauthorized:
    case HTTP_STATUS.forbidden:
      icon = <StopFilled />;
      status = EMPTY_STATE_STATUS.error;
      title = t('unauthorizedEmptyStateTitle');
      subtitle = t('unauthorizedEmptyStateSubtitle');
      break;
    case HTTP_STATUS.internalServerError:
    default:
      icon = <ExclamationCircleFilled />;
      status = EMPTY_STATE_STATUS.error;
      title = t('internalErrorEmptyStateTitle');
      subtitle = t('internalErrorEmptyStateSubtitle');
      break;
  }

  return (
    <PageTemplate fullScreen>
      <div className="ErrorPage">
        <EmptyState icon={icon} title={title} subtitle={subtitle} status={status} />
        <div className="ErrorPage-buttons">
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleBackClick}>
            {t('common:back')}
          </Button>
          <Button icon={<HomeOutlined />} onClick={handleHomeClick}>
            {t('homeButton')}
          </Button>
        </div>
        {!!error.stack && (
          <div className="ErrorPage-errorDetails">
            <div>Message: {error.message}</div>
            <div>{error.stack}</div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

ErrorPage.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    error: PropTypes.shape({
      name: PropTypes.string.isRequired,
      status: PropTypes.oneOf(Object.values(HTTP_STATUS)).isRequired,
      message: PropTypes.string,
      stack: PropTypes.string
    })
  }).isRequired
};

export default ErrorPage;
