import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { otherUserShape } from '../ui/default-prop-types.js';

function ResourceInfoCell({ title, url, description, createdOn, updatedOn, createdBy, updatedBy, onClick }) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  const renderContent = () => (
    <div>
      <div className="ResourceInfoCell-mainText">{title}</div>
      {!!description && <div className="ResourceInfoCell-description">{description}</div>}
      <div className="ResourceInfoCell-subtext">
        <span>{t('common:created')}: {formatDate(createdOn)}</span>
        <span> | </span>
        <span>{t('common:lastUpdate')}: {formatDate(updatedOn)}</span>
        {!!createdBy && !!updatedBy && (
          <Fragment>
            <br />
            <span>{t('common:createdBy')}: {createdBy.displayName}</span>
            <span> | </span>
            <span>{t('common:updatedBy')}: {updatedBy.displayName}</span>
          </Fragment>
        )}
      </div>
    </div>
  );

  const handleClick = event => {
    if (onClick) {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    }
  };

  return (
    <div className="ResourceInfoCell" >
      <div className="ResourceInfoCell-infoContainer">
        {!!url && (
          <a className="ResourceInfoCell-infoContent" href={onClick ? null : url} onClick={handleClick}>
            {renderContent()}
          </a>
        )}
        {!url && (
          <div className="ResourceInfoCell-infoContent">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
}

ResourceInfoCell.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string,
  description: PropTypes.string,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: otherUserShape,
  updatedBy: otherUserShape,
  onClick: PropTypes.func
};

ResourceInfoCell.defaultProps = {
  url: null,
  description: null,
  createdBy: null,
  updatedBy: null,
  onClick: null
};

export default ResourceInfoCell;
