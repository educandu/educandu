import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import DocumentRating from './document-rating.js';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { documentRatingBasicShape } from '../ui/default-prop-types.js';

function ResourceInfoCell({ title, url, shortDescription, subtext, documentRating, verified, onTitleClick }) {
  const { t } = useTranslation('resourceInfoCell');

  const titleContent = (
    <Fragment>
      {!!verified && (
        <Tooltip title={t('common:verifiedDocumentBadge')}>
          <SafetyCertificateOutlined className="ResourceInfoCell-badge" />
        </Tooltip>
      )}
      {title}
    </Fragment>
  );

  const titleElement = url
    ? <a className="ResourceInfoCell-title" href={url} onClick={onTitleClick}>{titleContent}</a>
    : <span className="ResourceInfoCell-title">{titleContent}</span>;

  return (
    <div className="ResourceInfoCell" >
      <div className="ResourceInfoCell-content">
        <div>
          {titleElement}
          {!!documentRating && (
            <div className="ResourceInfoCell-documentRating">
              <DocumentRating
                small
                oneLine
                value={documentRating.averageRatingValue}
                totalCount={documentRating.ratingsCount}
                />
            </div>
          )}
          {!!shortDescription && <div className="ResourceInfoCell-description">{shortDescription}</div>}
          <div className="ResourceInfoCell-subtext">{subtext}</div>
        </div>
      </div>
    </div>
  );
}

ResourceInfoCell.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string,
  shortDescription: PropTypes.string.isRequired,
  subtext: PropTypes.node.isRequired,
  documentRating: documentRatingBasicShape,
  verified: PropTypes.bool,
  onTitleClick: PropTypes.func
};

ResourceInfoCell.defaultProps = {
  url: null,
  documentRating: null,
  verified: false,
  onTitleClick: null
};

export default ResourceInfoCell;
