import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import routes from '../utils/routes.js';
import { HTTP_STATUS } from '../domain/constants.js';
import EmptyState, { EMPTY_STATE_STATUS } from './empty-state.js';
import { ArrowLeftOutlined, ExclamationCircleFilled, FileSearchOutlined, HomeOutlined, StopFilled } from '@ant-design/icons';

function ErrorPage({ error, i18n }) {
  let icon;
  let status;
  let title;
  let subtitle;

  const backHtml = `<a onclick="window.history.back();">${i18n.t('common:back')}</a>`;
  const homeHtml = `<a href="${routes.getHomeUrl()}">${i18n.t('errorPage:homeButton')}</a>`;

  switch (error?.status) {
    case HTTP_STATUS.notFound:
      status = EMPTY_STATE_STATUS.info;
      icon = <FileSearchOutlined />;
      title = i18n.t('errorPage:notFoundEmptyStateTitle');
      subtitle = i18n.t('errorPage:notFoundEmptyStateSubtitle');
      break;
    case HTTP_STATUS.unauthorized:
    case HTTP_STATUS.forbidden:
      icon = <StopFilled />;
      status = EMPTY_STATE_STATUS.error;
      title = i18n.t('errorPage:unauthorizedEmptyStateTitle');
      subtitle = i18n.t('errorPage:unauthorizedEmptyStateSubtitle');
      break;
    case HTTP_STATUS.internalServerError:
    default:
      icon = <ExclamationCircleFilled />;
      status = EMPTY_STATE_STATUS.error;
      title = i18n.t('errorPage:internalErrorEmptyStateTitle');
      subtitle = i18n.t('errorPage:internalErrorEmptyStateSubtitle');
      break;
  }

  return (
    <div className="ErrorPage">
      <main className="ErrorPage-content">
        <EmptyState
          icon={icon}
          title={title}
          subtitle={subtitle}
          status={status}
          />
        <div className="ErrorPage-buttons">
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            className="ErrorPage-button ErrorPage-button--primary"
            >
            <span dangerouslySetInnerHTML={{ __html: backHtml }} />
          </Button>
          <Button
            icon={<HomeOutlined />}
            className="ErrorPage-button"
            >
            <span dangerouslySetInnerHTML={{ __html: homeHtml }} />
          </Button>
        </div>
        {!!error.expose && (
          <div className="ErrorPage-errorDetails">
            <pre className="ErrorPage-message">Message: {error.displayMessage || error.message}</pre>
            <pre className="ErrorPage-stack">{error.stack}</pre>
          </div>
        )}
      </main>
    </div>
  );
}

ErrorPage.propTypes = {
  error: PropTypes.object.isRequired,
  i18n: PropTypes.object.isRequired
};

export default ErrorPage;
