import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import DocumentIcon from './icons/general/document-icon.js';
import { SEARCH_RESOURCE_TYPE } from '../domain/constants.js';
import { getResourceIconByResourceType } from '../utils/resource-utils.js';

function ResourceTypeCell({ searchResourceType }) {
  const { t } = useTranslation();

  const Icon = searchResourceType === SEARCH_RESOURCE_TYPE.document
    ? DocumentIcon
    : getResourceIconByResourceType({ resourceType: searchResourceType });

  const tooltip = searchResourceType === SEARCH_RESOURCE_TYPE.document
    ? t('common:searchResourceType_document')
    : t(`common:resourceType_${searchResourceType}`);

  return (
    <div className="ResourceTypeCell">
      <Tooltip title={tooltip}>
        <Icon />
      </Tooltip>
    </div>
  );
}

ResourceTypeCell.propTypes = {
  searchResourceType: PropTypes.oneOf(Object.values(SEARCH_RESOURCE_TYPE)).isRequired
};

export default ResourceTypeCell;
